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
          200: VideoSchema.GetListVideosResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    videoController.getUserVideos.bind(videoController),
  );

  app.get(
    '/videos/:id',
    {
      schema: {
        summary: 'Retrieve a video',
        description: 'desc',
        tags: ['Video'],
        security: [{ bearerAuth: [] }],
        params: VideoSchema.VideoIdParamsSchema,
        response: {
          200: VideoSchema.GetVideoResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          403: ErrorSchema.ForbiddenError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    videoController.getVideoById.bind(videoController),
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

  app.get(
    '/videos/progress',
    {
      schema: {
        summary: 'Get All Video Processing Jobs Progress',
        description:
          'Establishes a Server-Sent Events (SSE) connection to receive real-time progress updates for all video processing jobs',
        tags: ['Video'],
        response: {
          200: {
            content: {
              'text/event-stream': {
                schema: VideoSchema.VideoProgressResponseSchema,
              },
            },
          },
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    videoController.streamAllJobsProgress.bind(videoController),
  );

  app.delete(
    '/videos/:id',
    {
      schema: {
        summary: 'Delete a video',
        description: 'desc',
        tags: ['Video'],
        security: [{ bearerAuth: [] }],
        params: VideoSchema.VideoIdParamsSchema,
        response: {
          204: {
            description: 'Default Response',
            type: 'null',
          },
          401: ErrorSchema.UnauthorizedError,
          403: ErrorSchema.ForbiddenError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    videoController.deleteVideo.bind(videoController),
  );
}
