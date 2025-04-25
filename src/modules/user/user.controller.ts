import { FastifyReply, FastifyRequest } from 'fastify';
import { GetUserResponse } from './user.schema';
import UserService from './user.service';

interface UserControllerDeps {
  userService: UserService;
}

export default class UserController {
  private readonly userService;

  constructor({ userService }: UserControllerDeps) {
    this.userService = userService;
  }

  async getUser(
    request: FastifyRequest<{ Reply: GetUserResponse }>,
    reply: FastifyReply<{ Reply: GetUserResponse }>,
  ) {
    const { id: userId } = request.user;
    const user = await this.userService.getUserById(userId);

    if (!user) {
      return reply.notFound();
    }

    return reply.code(200).send({
      statusCode: 200,
      message: 'User profile retrieved successfully.',
      data: {
        user,
      },
    });
  }
}
