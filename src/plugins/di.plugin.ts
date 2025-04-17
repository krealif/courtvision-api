import path from 'node:path';
import { Lifetime, asClass, asFunction, asValue } from 'awilix';
import fp from 'fastify-plugin';
import { diContainer, fastifyAwilixPlugin } from '@fastify/awilix';
import { createDbClient } from '@/infra/db';
import { DbValidator } from '@/utils/db-validator.util';

/**
 * Registers @fastify/awilix and configures the dependency injection container.
 *
 * @see https://github.com/fastify/fastify-awilix
 */
export default fp(async (fastify) => {
  await fastify.register(fastifyAwilixPlugin, {
    disposeOnClose: true,
    disposeOnResponse: true,
    strictBooleanEnforced: true,
    asyncInit: true,
    asyncDispose: true,
  });

  diContainer.register({
    logger: asValue(fastify.log),
    db: asFunction(createDbClient, {
      lifetime: Lifetime.SINGLETON,
      asyncInit: 'init',
      asyncDispose: 'close',
      eagerInject: true,
    }),
    dbValidator: asClass(DbValidator).singleton(),
  });

  diContainer.loadModules(
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
});
