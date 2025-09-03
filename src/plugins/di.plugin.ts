import path from 'node:path';
import { Lifetime, asClass, asFunction, asValue } from 'awilix';
import axios from 'axios';
import fp from 'fastify-plugin';
import { diContainerClassic, fastifyAwilixPlugin } from '@fastify/awilix';
import { createDbClient } from '@/infra/db';
import { videoQueue, videoQueueEvents } from '@/infra/queue/video.queue';
import { createS3Client } from '@/infra/storage';
import { DbValidator } from '@/utils/db-validator.util';

/**
 * Registers @fastify/awilix and configures the dependency injection container.
 *
 * @see https://github.com/fastify/fastify-awilix
 */
export default fp(async (fastify) => {
  await fastify.register(fastifyAwilixPlugin, {
    container: diContainerClassic,
    disposeOnClose: true,
    disposeOnResponse: true,
    strictBooleanEnforced: true,
    asyncInit: true,
    asyncDispose: true,
  });

  diContainerClassic.register({
    logger: asValue(fastify.log),
    db: asFunction(createDbClient, {
      lifetime: Lifetime.SINGLETON,
      asyncInit: 'init',
      asyncDispose: 'close',
      eagerInject: true,
    }),
    s3: asFunction(createS3Client).singleton(),
    dbValidator: asClass(DbValidator).singleton(),
    videoQueue: asFunction(() => videoQueue, {
      lifetime: Lifetime.SINGLETON,
      asyncDispose: 'close',
    }),
    videoQueueEvents: asFunction(() => videoQueueEvents, {
      lifetime: Lifetime.SINGLETON,
      asyncDispose: 'close',
    }),
    http: asValue(axios),
  });

  diContainerClassic.loadModules(
    [
      path.join(__dirname, '../modules/**/*.controller.{ts,js}'),
      path.join(__dirname, '../modules/**/*.service.{ts,js}'),
    ],
    {
      formatName: 'camelCase',
      resolverOptions: {
        lifetime: Lifetime.SINGLETON,
        register: asClass,
      },
    },
  );

  diContainerClassic.loadModules(
    [path.join(__dirname, '../modules/**/*.queueEvent.{ts,js}')],
    {
      formatName: 'camelCase',
      resolverOptions: {
        lifetime: Lifetime.SINGLETON,
        register: asClass,
        asyncInit: 'init',
      },
    },
  );
});
