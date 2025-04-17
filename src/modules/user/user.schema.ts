import { Type } from '@sinclair/typebox';

export const UserSchema = Type.Object({
  id: Type.Number({ examples: [1] }),
  name: Type.String({ examples: ['Alice'] }),
  email: Type.String({
    format: 'email',
    examples: ['alice@example.com'],
  }),
});

export const UserResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    user: UserSchema,
  }),
});
