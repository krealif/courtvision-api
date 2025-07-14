import { Queue, QueueEvents } from 'bullmq';
import { env } from '@/config';

const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
};

export const videoQueue = new Queue('testQueue', {
  connection: {
    ...redisConnection,
    enableOfflineQueue: false,
  },
});

export const videoQueueEvents = new QueueEvents('testQueue', {
  connection: redisConnection,
});
