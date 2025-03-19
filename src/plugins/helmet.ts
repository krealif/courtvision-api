import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';

/**
 * Registers the Helmet plugin to enhance security by setting HTTP headers.
 *
 * @see https://github.com/fastify/fastify-helmet
 */
export default fp(async (fastify) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  });
});
