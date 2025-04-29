import { Static, Type } from '@sinclair/typebox';
import { UserSchema } from '../user/user.schema';

export const SignupBodySchema = Type.Object({
  name: Type.String({
    minLength: 1,
    maxLength: 255,
    examples: ['Alice'],
    description: "The user's full name.",
  }),
  email: Type.String({
    format: 'email',
    maxLength: 255,
    examples: ['alice@example.com'],
    description: "The user's email address.",
  }),
  password: Type.String({
    minLength: 8,
    maxLength: 72,
    examples: ['Password123!'],
    description: "The user's password.",
  }),
});
export type SignupBody = Static<typeof SignupBodySchema>;

export const LoginBodySchema = Type.Object({
  email: Type.String({
    format: 'email',
    examples: ['alice@example.com'],
    description: "The user's email address.",
  }),
  password: Type.String({
    examples: ['Password123!'],
    description: "The user's password.",
  }),
});
export type LoginBody = Static<typeof LoginBodySchema>;

const AuthPayloadSchema = Type.Object({
  message: Type.String(),
  data: Type.Object({
    user: UserSchema,
    token: Type.String(),
  }),
});

export const SignupResponseSchema = Type.Intersect([
  Type.Object({ statusCode: Type.Literal(201) }),
  AuthPayloadSchema,
]);
export type SignupResponse = Static<typeof SignupResponseSchema>;

export const LoginResponseSchema = Type.Intersect([
  Type.Object({ statusCode: Type.Literal(200) }),
  AuthPayloadSchema,
]);
export type LoginResponse = Static<typeof LoginResponseSchema>;
