import { QueueOptions } from 'bullmq';

export interface QueueConfig {
  queueOptions?: Partial<QueueOptions>;
}

export function createQueueRegistry<T extends string>(
  registry: Record<T, QueueConfig>,
): Record<T, QueueConfig> {
  return registry;
}

export const queueRegistry = createQueueRegistry({
  test1Queue: {},
});

export type QueueName = keyof typeof queueRegistry;
export type QueueRegistry = typeof queueRegistry;
