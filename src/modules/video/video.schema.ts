import { Static, Type } from '@sinclair/typebox';
import { VideoStatus } from '@/infra/db/db.schema';

const VideoSchema = Type.Object({
  id: Type.Number({
    examples: [1],
    description:
      'The unique identifier for the basketball match video resource.',
  }),
  title: Type.String({
    examples: ['Celtics vs Mavericks'],
    description: 'The title of the basketball match.',
  }),
  date: Type.Optional(
    Type.String({
      format: 'date',
      examples: ['2025-04-10'],
      description:
        'The date when the match took place, in ISO 8601 format (YYYY-MM-DD).',
    }),
  ),
  venue: Type.Optional(
    Type.String({
      examples: ['TD Garden Boston'],
      description: 'The location or arena where where the match was played.',
    }),
  ),
  status: Type.Enum(VideoStatus, {
    description: 'The current analysis status of the video.',
    examples: ['waiting', 'processing', 'completed', 'failed'],
  }),
  video_url: Type.String({
    description: 'The public S3 URL of the uploaded video.',
  }),
  created_at: Type.String({
    format: 'date-time',
    description: 'The date and time when the video resource was created.',
    examples: ['2025-04-10T14:30:00Z'],
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
    description:
      'The title of the basketball match, typically formatted as "[Team 1] vs [Team 2]".',
  }),
  date: Type.Optional(
    Type.String({
      format: 'date',
      examples: ['2025-04-10'],
      description:
        'The date when the match took place, in ISO 8601 format (YYYY-MM-DD).',
    }),
  ),
  venue: Type.Optional(
    Type.String({
      minLength: 1,
      maxLength: 255,
      examples: ['TD Garden Boston'],
      description: 'The location or arena where where the match was played.',
    }),
  ),
  video_url: Type.String({
    format: 'uri',
    minLength: 1,
    maxLength: 255,
    description: 'The public S3 URL of the uploaded video.',
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

export const IndexVideosResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    videos: Type.Array(VideoSchema),
  }),
});

export type IndexVideosResponse = Static<typeof IndexVideosResponseSchema>;

export const VideoIdParamsSchema = Type.Object({
  id: Type.Number({
    description:
      'The unique identifier for the basketball match video resource.',
  }),
});
export type VideoIdParams = Static<typeof VideoIdParamsSchema>;

export const ShowVideoResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    video: VideoSchema,
  }),
});
export type ShowVideoResponse = Static<typeof ShowVideoResponseSchema>;

export const VideoProgressResponseSchema = Type.Object({
  data: Type.Object({
    video: Type.Object({
      id: Type.Number({
        examples: [1],
        description:
          'The unique identifier for the basketball match video resource.',
      }),
      status: Type.Enum(VideoStatus, {
        description: 'The current analysis status of the video.',
        examples: ['processing'],
      }),
      progress: Type.Optional(
        Type.Number({
          description:
            'The percentage of video analysis completion, from 0 to 100.',
          examples: [25],
          minimum: 0,
          maximum: 100,
        }),
      ),
    }),
  }),
});
export type VideoProgressResponse = Static<typeof VideoProgressResponseSchema>;
