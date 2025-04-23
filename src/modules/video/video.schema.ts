import { Static, Type } from '@sinclair/typebox';

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
  video_url: Type.String({
    description: 'Public S3 URL of the uploaded video',
  }),
});

export type VideoJobData = Pick<Static<typeof VideoSchema>, 'id' | 'video_url'>;

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

export const CreateVideoResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    video: VideoSchema,
  }),
});
export type CreateVideoResponse = Static<typeof CreateVideoResponseSchema>;

export const UserVideosResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    videos: Type.Array(VideoSchema),
  }),
});
export type UserVideosResponse = Static<typeof UserVideosResponseSchema>;

export const VideoProgressResponseSchema = Type.Object({
  data: Type.Object({
    video: Type.Object({
      id: Type.Number({ examples: [1] }),
      status: Type.String(),
      progress: Type.Optional(Type.Number()),
    }),
  }),
});
export type VideoProgressResponse = Static<typeof UserVideosResponseSchema>;
