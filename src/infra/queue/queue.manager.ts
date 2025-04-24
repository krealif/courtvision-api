import { JobsOptions, Queue, QueueEvents, QueueOptions } from 'bullmq';
import { Logger } from 'pino';
import { env } from '@/config';
import { QueueName, queueRegistry } from './queue.registry';

interface QueueManagerDeps {
  logger: Logger;
}

export class QueueManager {
  private logger;
  private registry;
  private redisConnection;

  private queues = new Map<string, Queue>();
  private queueEvents = new Map<string, QueueEvents>();

  constructor({ logger }: QueueManagerDeps) {
    this.logger = logger;
    this.registry = queueRegistry;

    this.redisConnection = {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      enableOfflineQueue: false,
    };
  }

  init() {
    this.logger.info('Initializing queue');
    for (const [name, config] of Object.entries(this.registry)) {
      this.createQueue(name, config.queueOptions);
      this.createQueueEvents(name);
    }
  }

  async close(): Promise<void> {
    this.logger.info('Closing queues');

    const closePromises = [
      ...Array.from(this.queues.values()).map((queue) => queue.close()),
      ...Array.from(this.queueEvents.values()).map((events) => events.close()),
    ];

    await Promise.all(closePromises);
    this.logger.info('All queues closed');
  }

  private createQueue(name: string, options?: Partial<QueueOptions>) {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.redisConnection,
        ...options,
      });

      this.queues.set(name, queue);
    }
  }

  private createQueueEvents(name: string) {
    if (!this.queueEvents.has(name)) {
      const queueEvents = new QueueEvents(name, {
        connection: this.redisConnection,
      });

      this.queueEvents.set(name, queueEvents);
    }
  }

  getQueue(queueName: QueueName) {
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new Error(`Queue "${queueName}" not initialized`);
    }

    return queue;
  }

  getQueueEvent(queueName: QueueName) {
    const queueEvent = this.queueEvents.get(queueName);

    if (!queueEvent) {
      throw new Error(`Queue event for "${queueName}" not initialized`);
    }

    return queueEvent;
  }

  async addJob<T>(
    queueName: QueueName,
    job: {
      name: string;
      data: T;
      options?: JobsOptions;
    },
  ) {
    const queue = this.getQueue(queueName);
    return queue.add(job.name, job.data, job.options);
  }
}
