import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import scalarUi from '@scalar/fastify-api-reference';

export default fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'CourtVision API',
        version: '1.0.0',
      },
    },
  });

  await fastify.register(scalarUi, {
    routePrefix: '/docs',
  });
});
