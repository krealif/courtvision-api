import { FastifyInstance } from 'fastify';
import VideoController from '@/modules/video/video.controller';
import * as VideoSchema from '@/modules/video/video.schema';
import ErrorSchema from '@/shared/error.schema';

export default function routes(app: FastifyInstance) {
  const videoController =
    app.diContainer.resolve<VideoController>('videoController');

  app.get(
    '/videos',
    {
      schema: {
        summary: 'Get User Videos',
        description: 'desc',
        tags: ['Video'],
        security: [{ bearerAuth: [] }],
        response: {
          200: VideoSchema.UserVideosResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    videoController.getUserVideos.bind(videoController),
  );

  app.post(
    '/videos',
    {
      schema: {
        summary: 'Create Video',
        description: 'desc',
        tags: ['Video'],
        security: [{ bearerAuth: [] }],
        body: VideoSchema.CreateVideoBodySchema,
        response: {
          200: VideoSchema.CreateVideoResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    videoController.createVideo.bind(videoController),
  );
}
