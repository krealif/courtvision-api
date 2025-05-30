import { FastifyInstance } from 'fastify';
import VideoController from '@/modules/video/video.controller';
import * as VideoSchema from '@/modules/video/video.schema';
import ErrorSchema from '@/shared/error.schema';

export default function routes(app: FastifyInstance) {
  const videoController =
    app.diContainer.resolve<VideoController>('videoController');

  app.post(
    '/videos',
    {
      schema: {
        summary: 'Create a video',
        description:
          'Creates a new video resource for analysis. Returns the created video object with analysis status information.',
        tags: ['Videos'],
        security: [{ bearerAuth: [] }],
        body: VideoSchema.CreateVideoBodySchema,
        response: {
          201: VideoSchema.CreateVideoResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    videoController.create.bind(videoController),
  );

  app.get(
    '/videos',
    {
      schema: {
        summary: 'List all videos',
        description:
          'Returns a list of videos that belong to the authenticated user. The videos are returned sorted by creation date, with the most recent videos appearing first.',
        tags: ['Videos'],
        security: [{ bearerAuth: [] }],
        response: {
          200: VideoSchema.IndexVideosResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    videoController.index.bind(videoController),
  );

  app.get(
    '/videos/:id',
    {
      schema: {
        summary: 'Retrieve a video',
        description: 'Retrieves the details of an existing video by its ID.',
        tags: ['Videos'],
        security: [{ bearerAuth: [] }],
        params: VideoSchema.VideoIdParamsSchema,
        response: {
          200: VideoSchema.ShowVideoResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          403: ErrorSchema.ForbiddenError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    videoController.show.bind(videoController),
  );

  app.get(
    '/videos/progress',
    {
      schema: {
        summary: 'Stream video analysing progress',
        description:
          'Establishes an SSE connection to receive real-time updates on all video analysing jobs.',
        tags: ['Videos'],
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
    videoController.streamProgress.bind(videoController),
  );

  app.delete(
    '/videos/:id',
    {
      schema: {
        summary: 'Delete a video',
        description:
          'Permanently deletes a video only if its status is "completed" or "failed". This cannot be undone. All associated analysis data will also be removed.',
        tags: ['Videos'],
        security: [{ bearerAuth: [] }],
        params: VideoSchema.VideoIdParamsSchema,
        response: {
          200: VideoSchema.DeleteVideoResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          403: ErrorSchema.ForbiddenError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    videoController.delete.bind(videoController),
  );
}
