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
    '/login',
    {
      schema: {
        summary: 'Login',
        description: 'Authenticate a user and retrieve access token.',
        tags: ['Auth'],
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
    '/signup',
    {
      schema: {
        summary: 'Signup',
        description: 'Registers a new user account in the system.',
        tags: ['Auth'],
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
