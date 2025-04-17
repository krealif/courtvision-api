import path from 'node:path';
import Fastify, { FastifyServerOptions } from 'fastify';
import { LoggerOptions } from 'pino';
import AutoLoad from '@fastify/autoload';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export interface BuildOptions extends FastifyServerOptions {
  logger?: LoggerOptions;
}

export default async function createServer(opts: BuildOptions = {}) {
  const app = Fastify(opts);

  app.withTypeProvider<TypeBoxTypeProvider>();

  app.register(import('@fastify/auth'));
  app.register(import('@fastify/sensible'));
  app.register(import('@fastify/under-pressure'));

  // Auto-load plugins
  app.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    dirNameRoutePrefix: false,
  });

  // Auto-load routes
  app.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    dirNameRoutePrefix: false,
    options: {
      prefix: 'api',
    },
  });

  app.get('/', () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}
