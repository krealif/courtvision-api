import { Static, Type } from '@sinclair/typebox';
import { VideoStatus } from '@/infra/db/db.schema';

const VideoSchema = Type.Object({
  id: Type.Number({ examples: [1] }),
  title: Type.String({
    examples: ['Celtics vs Mavericks'],
  }),
  date: Type.Optional(
    Type.String({ format: 'date', examples: ['2025-04-10'] }),
  ),
  venue: Type.Optional(
    Type.String({
      examples: ['TD Garden Boston'],
    }),
  ),
  status: Type.Enum(VideoStatus),
  video_url: Type.String({
    description: 'Public S3 URL of the uploaded video',
  }),
});

export type VideoJobData = Pick<Static<typeof VideoSchema>, 'id' | 'video_url'>;

/**
 * Request Schema
 */
export const CreateVideoBodySchema = Type.Object({
  title: Type.String({
    minLength: 1,
    maxLength: 255,
    examples: ['Celtics vs Mavericks'],
  }),
  date: Type.Optional(
    Type.String({ format: 'date', examples: ['2025-04-10'] }),
  ),
  venue: Type.Optional(
    Type.String({
      minLength: 1,
      maxLength: 255,
      examples: ['TD Garden Boston'],
    }),
  ),
  video_url: Type.String({
    minLength: 1,
    maxLength: 255,
    description: 'Public S3 URL of the uploaded video',
  }),
});
export type CreateVideoBody = Static<typeof CreateVideoBodySchema>;

/**
 * Response Schema
 */
export const CreateVideoResponseSchema = Type.Object({
  statusCode: Type.Literal(201),
  message: Type.String(),
  data: Type.Object({
    video: VideoSchema,
  }),
});
export type CreateVideoResponse = Static<typeof CreateVideoResponseSchema>;

export const GetListVideosResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    videos: Type.Array(VideoSchema),
  }),
});

export type GetListVideosResponse = Static<typeof GetListVideosResponseSchema>;

export const VideoIdParamsSchema = Type.Object({
  id: Type.Number({ description: 'ID of the video' }),
});
export type VideoIdParams = Static<typeof VideoIdParamsSchema>;

export const GetVideoResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    video: VideoSchema,
  }),
});
export type GetVideoResponse = Static<typeof GetVideoResponseSchema>;

export const VideoProgressResponseSchema = Type.Object({
  data: Type.Object({
    video: Type.Object({
      id: Type.Number({ examples: [1] }),
      status: Type.Enum(VideoStatus),
      progress: Type.Optional(Type.Number()),
    }),
  }),
});
export type VideoProgressResponse = Static<typeof VideoProgressResponseSchema>;
