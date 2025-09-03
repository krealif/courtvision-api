import { Queue, Worker } from 'bullmq';
import { EventSource } from 'eventsource';
import { FastifyInstance } from 'fastify';
import hyperid from 'hyperid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DbClient } from '@/infra/db';
import { VideoStatus, users } from '@/infra/db/db.schema';
import { VideoProgressResponse } from '@/modules/video/video.schema';
import createServer from '@/server';
import { user1 } from '../fixtures/data';

let server: FastifyInstance;
let esUrl: string;
let token: string;
let user1Id: number;

let db: DbClient;
let videoQueue: Queue;
let videoWorker: Worker;

beforeAll(async () => {
  server = await createServer();
  // listen on a random available port
  await server.listen({ port: 0 });
  await server.ready();
  const info = server.server.address();

  db = server.diContainer.resolve('db');
  videoQueue = server.diContainer.resolve('videoQueue');

  videoWorker = new Worker(videoQueue.name, null, {
    connection: videoQueue.opts.connection,
  });

  if (typeof info === 'object' && info?.port) {
    esUrl = `http://localhost:${info.port}/api`;
  } else {
    throw new Error('Failed to get server address');
  }
});

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await db.delete(users);

  await videoQueue.drain();
  await videoQueue.clean(0, 1000, 'completed');
  await videoQueue.clean(0, 1000, 'failed');
  await videoQueue.clean(0, 1000, 'delayed');

  const [result] = await db.insert(users).values(user1);

  token = server.jwt.sign({
    id: result.insertId,
    email: user1.email,
  });

  user1Id = result.insertId;
});

describe('Video event progress over SSE', () => {
  it('should emits a completed event once the job has completed', async () => {
    const es = new EventSource(`${esUrl}/videos/progress`, {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${token}`,
          },
        }),
    });

    const videoId = Math.floor(Math.random() * 100);
    const job = await videoQueue.add(
      'analyse-video',
      {
        id: videoId,
        video_url: 'example.mp4',
      },
      {
        jobId: `v${videoId}_${user1Id}-${hyperid()()}`,
      },
    );

    setTimeout(() => {
      const jobToken = job.token ?? '';
      void videoWorker
        .getNextJob(jobToken)
        .then(() =>
          job.moveToCompleted(JSON.stringify({ result: 'ok' }), jobToken),
        );
    }, 1000);

    await new Promise<void>((resolve, reject) => {
      es.onmessage = (ev) => {
        const payload = JSON.parse(
          ev.data as string,
        ) as VideoProgressResponse['data'];

        expect(payload.video.status).toBe(VideoStatus.COMPLETED);

        es.close();
        resolve();
      };

      es.onerror = (err) => {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(err);
      };
    });
  });

  it('should should emit a failed event when the video job fails', async () => {
    const es = new EventSource(`${esUrl}/videos/progress`, {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${token}`,
          },
        }),
    });

    const videoId = Math.floor(Math.random() * 100);
    const job = await videoQueue.add(
      'analyse-video',
      {
        id: videoId,
        video_url: 'example.mp4',
      },
      {
        jobId: `v${videoId}_${user1Id}-${hyperid()()}`,
      },
    );

    setTimeout(() => {
      const jobToken = job.token ?? '';
      void videoWorker
        .getNextJob(jobToken)
        .then(() => job.moveToFailed(new Error('test'), jobToken));
    }, 1000);

    await new Promise<void>((resolve, reject) => {
      es.onmessage = (ev) => {
        const payload = JSON.parse(
          ev.data as string,
        ) as VideoProgressResponse['data'];

        expect(payload.video.status).toBe(VideoStatus.FAILED);

        es.close();
        resolve();
      };

      es.onerror = (err) => {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(err);
      };
    });
  });

  it('should emit a progress event when the video job reports progress', async () => {
    const es = new EventSource(`${esUrl}/videos/progress`, {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${token}`,
          },
        }),
    });

    const videoId = Math.floor(Math.random() * 100);
    const job = await videoQueue.add(
      'analyse-video',
      {
        id: videoId,
        video_url: 'example.mp4',
      },
      {
        jobId: `v${videoId}_${user1Id}-${hyperid()()}`,
      },
    );

    setTimeout(() => {
      const jobToken = job.token ?? '';
      void videoWorker.getNextJob(jobToken).then(() => job.updateProgress(10));
    }, 1000);

    await new Promise<void>((resolve, reject) => {
      es.onmessage = (ev) => {
        const payload = JSON.parse(
          ev.data as string,
        ) as VideoProgressResponse['data'];

        expect(payload.video.progress).toBe(10);

        es.close();
        resolve();
      };

      es.onerror = (err) => {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(err);
      };
    });
  });

  it('should return 401 when unauthorized', async () => {
    const response = await fetch(`${esUrl}/videos/progress`);

    expect(response.status).toBe(401);
  });
});
