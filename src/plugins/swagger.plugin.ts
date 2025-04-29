import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';

export default fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'CourtVision API',
        version: '1.0.0',
        description: 'API documentation for CourtVision App.',
      },
      tags: [
        {
          name: 'Authentication',
          description: 'Endpoints related to user authentication.',
        },
        {
          name: 'Users',
          description: 'Endpoints related to user data.',
        },
        {
          name: 'Videos',
          description: 'Endpoints related to basketball match video analysis.',
        },
        {
          name: 'S3 Storage',
          description:
            'Endpoints related to file management in S3 (Object Storage).',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  });

  await fastify.register(import('@scalar/fastify-api-reference'), {
    routePrefix: '/docs',
    configuration: {
      pageTitle: 'CourtVision API Docs',
    },
  });
});
