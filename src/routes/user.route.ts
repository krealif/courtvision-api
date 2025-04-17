import { FastifyInstance } from 'fastify';
import UserController from '@/modules/user/user.controller';
import { UserResponseSchema } from '@/modules/user/user.schema';
import ErrorSchema from '@/shared/error.schema';

export default function routes(app: FastifyInstance) {
  const userController =
    app.diContainer.resolve<UserController>('userController');

  app.get(
    '/profile',
    {
      schema: {
        summary: 'Get Profile',
        description:
          'Retrieves the profile information of the currently authenticated user.',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
        response: {
          200: UserResponseSchema,
          401: ErrorSchema.ForbiddenError,
          404: ErrorSchema.NotFoundError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    userController.getProfile.bind(userController),
  );
}
