import fp from 'fastify-plugin';
import type { FastifyCorsOptions } from '@fastify/cors';
import cors from '@fastify/cors';
import { env } from '@/config';

/**
 * Enables the use of CORS in a Fastify application.
 *
 * @see https://github.com/fastify/fastify-cors
 */
export default fp<FastifyCorsOptions>(async (fastify) => {
  await fastify.register(cors, {
    origin: env.ALLOWED_ORIGIN ?? true,
    credentials: true,
  });
});
