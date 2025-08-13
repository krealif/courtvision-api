import { FastifyInstance } from 'fastify';
import UserController from '@/modules/user/user.controller';
import * as UserSchema from '@/modules/user/user.schema';
import ErrorSchema from '@/shared/error.schema';

export default function routes(app: FastifyInstance) {
  const userController =
    app.diContainer.resolve<UserController>('userController');

  app.get(
    '/users/profile',
    {
      schema: {
        summary: 'Retrieve a user profile',
        description:
          'Retrieves the profile information of the currently authenticated user.',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        response: {
          200: UserSchema.ShowUserResponseSchema,
          401: ErrorSchema.ForbiddenError,
          404: ErrorSchema.NotFoundError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    userController.show.bind(userController),
  );

  app.put(
    '/users/profile',
    {
      schema: {
        summary: 'Update a user profile',
        description:
          'Updates the profile information of currently authenticated user',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        body: UserSchema.UpdateUserBodySchema,
        response: {
          200: UserSchema.ShowUserResponseSchema,
          400: ErrorSchema.BadRequestError,
          401: ErrorSchema.ForbiddenError,
          404: ErrorSchema.NotFoundError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    userController.update.bind(userController),
  );
}
