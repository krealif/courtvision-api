import { Static, Type } from '@sinclair/typebox';

export const UserSchema = Type.Object({
  id: Type.Number({
    examples: [1],
    description: 'The unique identifier for the user resource.',
  }),
  name: Type.String({
    examples: ['Alice'],
    description: "The user's full name.",
  }),
  email: Type.String({
    format: 'email',
    examples: ['alice@example.com'],
    description: "The user's email address.",
  }),
  photo_url: Type.Optional(
    Type.String({
      description: 'The public S3 URL of the uploaded photo profile.',
    }),
  ),
});

export const UpdateUserBodySchema = Type.Object({
  name: Type.String({
    minLength: 1,
    maxLength: 255,
    examples: ['Alice'],
    description: "The user's full name.",
  }),
  email: Type.String({
    minLength: 1,
    maxLength: 255,
    format: 'email',
    examples: ['alice@example.com'],
    description: "The user's email address.",
  }),
  photo_url: Type.Optional(
    Type.String({
      format: 'uri',
      minLength: 1,
      maxLength: 255,
      description: 'The public S3 URL of the uploaded photo profile.',
    }),
  ),
});
export type UpdateUserBody = Static<typeof UpdateUserBodySchema>;

export const ShowUserResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    user: UserSchema,
  }),
});
export type ShowUserResponse = Static<typeof ShowUserResponseSchema>;
