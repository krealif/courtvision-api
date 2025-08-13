import { Job, Queue, Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DbClient } from '@/infra/db';
import { VideoStatus, users, videoResults, videos } from '@/infra/db/db.schema';
import {
  IndexVideosResponse,
  VideoJobData,
} from '@/modules/video/video.schema';
import createServer from '@/server';
import { user1, user2, videoResult } from '../fixtures/data';

let server: FastifyInstance;
let db: DbClient;
let videoQueue: Queue;
let token: string;

let user1Id: number;
let user2Id: number;

beforeAll(async () => {
  server = await createServer();
  db = server.diContainer.resolve('db');
  videoQueue = server.diContainer.resolve('videoQueue');
});

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await db.delete(users);
  await db.delete(videos);

  const [result1] = await db.insert(users).values(user1);
  const [result2] = await db.insert(users).values(user2);

  token = server.jwt.sign({
    id: result1.insertId,
    email: user1.email,
  });

  user1Id = result1.insertId;
  user2Id = result2.insertId;
});

describe('List All Videos', () => {
  it('should return only the videos that belong to the authenticated user', async () => {
    await db.insert(videos).values([
      {
        user_id: user1Id,
        title: 'Basketball Match 1',
        video_url: 'video/match.mp4',
        status: VideoStatus.WAITING,
      },
      {
        user_id: user1Id,
        title: 'Basketball Match 2',
        video_url: 'video/match2.mp4',
        status: VideoStatus.COMPLETED,
      },
      {
        user_id: user2Id,
        title: 'Other Match',
        video_url: 'video/other.mp4',
        status: VideoStatus.COMPLETED,
      },
    ]);

    const response = await server.inject({
      method: 'GET',
      url: '/api/videos',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body: IndexVideosResponse = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.data.videos).toHaveLength(2);
  });

  it('should return an empty list when the user has no videos', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/videos',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body: IndexVideosResponse = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.data.videos).toEqual([]);
  });

  it('should deny access when the user is unauthenticated', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/videos',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });
});

describe('Retrive Video', () => {
  let user1VideoId: number;
  let user2VideoId: number;

  beforeEach(async () => {
    const data = {
      title: 'Basketball Match 2',
      video_url: 'video/match2.mp4',
      status: VideoStatus.COMPLETED,
    };

    const [video1] = await db
      .insert(videos)
      .values([{ user_id: user1Id, ...data }]);

    const [video2] = await db
      .insert(videos)
      .values([{ user_id: user2Id, ...data }]);

    user1VideoId = video1.insertId;
    user2VideoId = video2.insertId;
  });

  it('should return the video when it belongs to the authenticated user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${user1VideoId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should deny access when the video belongs to another user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${user2VideoId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toHaveProperty('error');
  });

  it('should deny access when the user is unauthenticated', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${user1VideoId}`,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });

  it("should return an error when the video doesn't exist", async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${user2VideoId + 1}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toHaveProperty('error');
  });
});

describe('Analyse Video', () => {
  let videoWorker: Worker;

  beforeAll(() => {
    videoWorker = new Worker(videoQueue.name, null, {
      connection: videoQueue.opts.connection,
    });
  });

  afterAll(async () => {
    await videoWorker.close();
  });

  beforeEach(async () => {
    await videoQueue.drain();
    await videoQueue.clean(0, 1000, 'completed');
    await videoQueue.clean(0, 1000, 'failed');
    await videoQueue.clean(0, 1000, 'delayed');
  });

  it('should enqueue a video for processing', async () => {
    const payload = {
      title: 'Celtics vs Mavericks',
      video_url: 'http://minio.test/cv/match.mp4',
    };

    const response = await server.inject({
      method: 'POST',
      url: `/api/videos`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      payload,
    });

    expect(response.statusCode).toBe(201);

    const videoFromDb = await db.query.videos.findFirst({
      where: eq(videos.title, payload.title),
    });

    expect(videoFromDb).not.toBeNull();

    const jobs = (await videoQueue.getJobs([
      'waiting',
      'delayed',
    ])) as Job<VideoJobData>[];
    const job = jobs.find((j) => j.data.video_url === 'match.mp4');

    expect(job).toBeDefined();
  });

  it('should deny access when the user is unauthenticated', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/videos',
      payload: {
        title: 'Celtics vs Mavericks',
        video_url: 'http://minio.test/cv/match.mp4',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });

  it('should return a validation error when data format is invalid', async () => {
    const invalidPayloads = [
      { title: 'Celtics vs Mavericks' },
      { video_url: 'http://minio.test/cv/match.mp4' },
      {
        title: 'Celtics vs Mavericks',
        video_url: 'minio.test/cv/match.mp4',
      },
      {
        title: 'Celtics vs Mavericks',
        video_url: 'http://minio.test/cv/match.mp4',
        date: 'date',
      },
    ];

    for (const payload of invalidPayloads) {
      const response = await server.inject({
        method: 'POST',
        url: '/api/videos',
        payload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error');
      expect(response.json()).toHaveProperty('validationErrors');
    }
  });
});

describe('Retrieve Video Analysis Result', () => {
  let user1VideoId: number;
  let user2VideoId: number;

  beforeEach(async () => {
    const data = {
      title: 'Basketball Match',
      video_url: 'video/match2.mp4',
      status: VideoStatus.COMPLETED,
    };

    const [video1] = await db
      .insert(videos)
      .values([{ user_id: user1Id, ...data }]);

    const [video2] = await db
      .insert(videos)
      .values([{ user_id: user2Id, ...data }]);

    await db.insert(videoResults).values([
      {
        video_id: video1.insertId,
        ...videoResult,
      },
      {
        video_id: video2.insertId,
        ...videoResult,
      },
    ]);

    user1VideoId = video1.insertId;
    user2VideoId = video2.insertId;
  });

  it('should return the video when it belongs to the authenticated user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${user1VideoId}/result`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it("should return 403 when accessing another user's video result", async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${user2VideoId}/result`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no authentication token is provided', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${user1VideoId}/result`,
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when the video does not exist', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${user2VideoId + 1}/result`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should return 404 when the video is still processing or failed', async () => {
    await db
      .update(videos)
      .set({
        status: VideoStatus.PROCESSING,
      })
      .where(eq(videos.id, user1VideoId));

    const response1 = await server.inject({
      method: 'GET',
      url: `/api/videos/${user1VideoId}/result`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response1.statusCode).toBe(404);

    await db
      .update(videos)
      .set({
        status: VideoStatus.FAILED,
      })
      .where(eq(videos.id, user1VideoId));

    const response2 = await server.inject({
      method: 'GET',
      url: `/api/videos/${user1VideoId}/result`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response2.statusCode).toBe(404);
  });
});

describe('Delete Video', () => {
  let user1VideoId: number;
  let user2VideoId: number;

  beforeEach(async () => {
    const [video1] = await db.insert(videos).values([
      {
        user_id: user1Id,
        title: 'Basketball Match 2',
        video_url: 'video/match2.mp4',
        status: VideoStatus.COMPLETED,
      },
    ]);

    const [video2] = await db.insert(videos).values([
      {
        user_id: user2Id,
        title: 'Basketball Match 2',
        video_url: 'video/match2.mp4',
        status: VideoStatus.COMPLETED,
      },
    ]);

    user1VideoId = video1.insertId;
    user2VideoId = video2.insertId;
  });

  it('should delete the video when it belongs to the authenticated user', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/api/videos/${user1VideoId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const deletedVideo = await db.query.videos.findFirst({
      where: eq(videos.id, user1VideoId),
    });

    expect(deletedVideo).toBeUndefined();
  });

  it('should deny deletion when the video belongs to another user', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/api/videos/${user2VideoId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toHaveProperty('error');

    const existingVideo = await db.query.videos.findFirst({
      where: eq(videos.id, user2VideoId),
    });

    expect(existingVideo).not.toBeUndefined();
  });

  it('should deny access when the user is unauthenticated', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/api/videos/${user1VideoId}`,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });

  it("should return an error when the video doesn't exist", async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/api/videos/${user2VideoId + 1}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toHaveProperty('error');
  });

  it('should deny deletion when the video status is processing', async () => {
    await db
      .update(videos)
      .set({
        status: VideoStatus.PROCESSING,
      })
      .where(eq(videos.id, user1VideoId));

    const response = await server.inject({
      method: 'DELETE',
      url: `/api/videos/${user1VideoId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toHaveProperty('error');
  });
});
