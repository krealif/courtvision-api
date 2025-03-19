import fp from 'fastify-plugin';
import { NodeEnv, env } from '@/config';

/**
 * Global error handler plugin for Fastify.
 */
export default fp((fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = error.statusCode ?? 500;

    if (statusCode === 500) {
      error.message =
        env.NODE_ENV === NodeEnv.production
          ? 'An unexpected error occurred while processing your request'
          : error.message;
    }

    return reply.send(error);
  });
});
