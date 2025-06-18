import { Job, Queue, Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DbClient } from '@/infra/db';
import { VideoStatus, users, videos } from '@/infra/db/db.schema';
import {
  IndexVideosResponse,
  VideoJobData,
} from '@/modules/video/video.schema';
import createServer from '@/server';

let server: FastifyInstance;
let db: DbClient;
let videoQueue: Queue;
let token: string;

let testUserId: number;
const testUser = {
  name: 'Alice',
  email: 'alice2@example.com',
  password: '$2b$10$GPbxrbtKSoyJa/52ECuOH.m1gsDbVNaCPP3t7gvAOS0dIDw0Yclim',
};
const testUser2 = {
  name: 'Bob',
  email: 'bob@example.com',
  password: '$2b$10$GPbxrbtKSoyJa/52ECuOH.m1gsDbVNaCPP3t7gvAOS0dIDw0Yclim',
};

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

  const [result] = await db.insert(users).values(testUser);

  token = server.jwt.sign({
    id: result.insertId,
    email: testUser.email,
  });

  testUserId = result.insertId;
});

describe('List All Videos', () => {
  it('should return only the videos that belong to the authenticated user', async () => {
    const [otherUser] = await db.insert(users).values(testUser2);

    await db.insert(videos).values([
      {
        user_id: testUserId,
        title: 'Basketball Match 1',
        video_url: 'video/match.mp4',
        status: VideoStatus.WAITING,
      },
      {
        user_id: testUserId,
        title: 'Basketball Match 2',
        video_url: 'video/match2.mp4',
        status: VideoStatus.COMPLETED,
      },
      {
        user_id: otherUser.insertId,
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
  let userVideoId: number;
  let otherVideoId: number;

  beforeEach(async () => {
    const [otherUser] = await db.insert(users).values(testUser2);

    const [video1] = await db.insert(videos).values([
      {
        user_id: testUserId,
        title: 'Basketball Match 2',
        video_url: 'video/match2.mp4',
        status: VideoStatus.COMPLETED,
      },
    ]);

    const [video2] = await db.insert(videos).values([
      {
        user_id: otherUser.insertId,
        title: 'Basketball Match 2',
        video_url: 'video/match2.mp4',
        status: VideoStatus.COMPLETED,
      },
    ]);

    userVideoId = video1.insertId;
    otherVideoId = video2.insertId;
  });

  it('should return the video when it belongs to the authenticated user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${userVideoId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should deny access when the video belongs to another user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${otherVideoId}`,
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
      url: `/api/videos/${userVideoId}`,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });

  it("should return an error when the video doesn't exist", async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/videos/${otherVideoId + 1}`,
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

  it('should mark video analyse as completed when job succeeds', async () => {
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

    const jobs = (await videoQueue.getJobs([
      'waiting',
      'delayed',
    ])) as Job<VideoJobData>[];

    const job = jobs.find((j) => j.data.video_url === 'match.mp4');

    expect(job).toBeDefined();

    const jobResult = {
      thumbnail_url: 'result/game_thumbnail.jpg',
      video_result: 'result/game_video.json',
      tracking_result: 'result/game_tracking.json',
      shot_result: 'result/game_shot.json',
    };

    const jobToken = job!.token ?? '';

    await videoWorker.getNextJob(jobToken);
    await job!.moveToCompleted(JSON.stringify(jobResult), jobToken);

    // Add wait time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const videoFromDb = await db.query.videos.findFirst({
      where: eq(videos.title, payload.title),
    });

    expect(videoFromDb?.status).toBe(VideoStatus.COMPLETED);
  });

  it('should mark video analyse as failed when job fails', async () => {
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

    const jobs = (await videoQueue.getJobs([
      'waiting',
      'delayed',
    ])) as Job<VideoJobData>[];

    const job = jobs.find((j) => j.data.video_url === 'match.mp4');

    expect(job).toBeDefined();

    const jobToken = job!.token ?? '';

    await videoWorker.getNextJob(jobToken);
    await job!.moveToFailed(new Error('test'), jobToken);

    // Add wait time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const videoFromDb = await db.query.videos.findFirst({
      where: eq(videos.title, payload.title),
    });

    expect(videoFromDb?.status).toBe(VideoStatus.FAILED);
  });

  it('should deny access when the user is unauthenticated', async () => {
    const payload = {
      title: 'Celtics vs Mavericks',
      video_url: 'http://minio.test/cv/match.mp4',
    };

    const response = await server.inject({
      method: 'POST',
      url: '/api/videos',
      // No Authorization header
      payload,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });
});

describe('Delete Video', () => {
  let userVideoId: number;
  let otherVideoId: number;

  beforeEach(async () => {
    const [otherUser] = await db.insert(users).values(testUser2);

    const [video1] = await db.insert(videos).values([
      {
        user_id: testUserId,
        title: 'Basketball Match 2',
        video_url: 'video/match2.mp4',
        status: VideoStatus.COMPLETED,
      },
    ]);

    const [video2] = await db.insert(videos).values([
      {
        user_id: otherUser.insertId,
        title: 'Basketball Match 2',
        video_url: 'video/match2.mp4',
        status: VideoStatus.COMPLETED,
      },
    ]);

    userVideoId = video1.insertId;
    otherVideoId = video2.insertId;
  });

  it('should delete the video when it belongs to the authenticated user', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/api/videos/${userVideoId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const deletedVideo = await db.query.videos.findFirst({
      where: eq(videos.id, userVideoId),
    });

    expect(deletedVideo).toBeUndefined();
  });

  it('should deny deletion when the video belongs to another user', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/api/videos/${otherVideoId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toHaveProperty('error');

    const existingVideo = await db.query.videos.findFirst({
      where: eq(videos.id, otherVideoId),
    });

    expect(existingVideo).not.toBeUndefined();
  });

  it('should deny access when the user is unauthenticated', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/api/videos/${userVideoId}`,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });

  it("should return an error when the video doesn't exist", async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/api/videos/${otherVideoId + 1}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toHaveProperty('error');
  });
});
