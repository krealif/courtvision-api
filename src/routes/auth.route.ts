import { FastifyInstance } from 'fastify';
import AuthController from '@/modules/auth/auth.controller';
import {
  LoginBodySchema,
  LoginResponseSchema,
  SignupBodySchema,
  SignupResponseSchema,
} from '@/modules/auth/auth.schema';
import ErrorSchema from '@/shared/error.schema';

export default function routes(app: FastifyInstance) {
  const authController =
    app.diContainer.resolve<AuthController>('authController');

  app.post(
    '/auth/login',
    {
      schema: {
        summary: 'Login',
        description:
          'Authenticates a user with email and password and returns an access token.',
        tags: ['Authentication'],
        security: [],
        body: LoginBodySchema,
        response: {
          200: LoginResponseSchema,
          400: ErrorSchema.BadRequestError,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
    },
    authController.login.bind(authController),
  );

  app.post(
    '/auth/signup',
    {
      schema: {
        summary: 'Register a user',
        description:
          'Creates a new user account and returns the user details along with an access token.',
        tags: ['Authentication'],
        security: [],
        body: SignupBodySchema,
        response: {
          201: SignupResponseSchema,
          400: ErrorSchema.BadRequestError,
          500: ErrorSchema.InternalServerError,
        },
      },
    },
    authController.signup.bind(authController),
  );
}
