import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt, { FastifyJWTOptions, FastifyJwtVerifyOptions } from '@fastify/jwt';
import { env } from '@/config';

// Middleware
function authenticate(opts: FastifyJwtVerifyOptions['verify'] = {}) {
  return async function <T extends FastifyRequest>(
    request: T,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await request.jwtVerify({
        decode: {},
        verify: {
          ...opts,
          algorithms: ['HS512'],
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unauthorized';
      reply.unauthorized(message);
    }
  };
}

/**
 * Registers @fastify/jwt and provides JWT authentication utilities.
 *
 * @see https://github.com/fastify/fastify-jwt
 */
export default fp<FastifyJWTOptions>(async (fastify) => {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      algorithm: 'HS512',
      expiresIn: '6h',
    },
    verify: {
      algorithms: ['HS512'],
    },
  });

  fastify.decorate('authenticate', authenticate);
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: number;
      email: string;
    };
  }
}
