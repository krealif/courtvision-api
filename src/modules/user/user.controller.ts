import { FastifyReply, FastifyRequest } from 'fastify';
import { ShowUserResponse } from './user.schema';
import UserService from './user.service';

interface UserControllerDeps {
  userService: UserService;
}

export default class UserController {
  private readonly userService;

  constructor({ userService }: UserControllerDeps) {
    this.userService = userService;
  }

  async show(
    request: FastifyRequest<{ Reply: ShowUserResponse }>,
    reply: FastifyReply<{ Reply: ShowUserResponse }>,
  ) {
    const { id: userId } = request.user;
    const user = await this.userService.findById(userId);

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
