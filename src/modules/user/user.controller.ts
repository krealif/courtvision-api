import { FastifyReply, FastifyRequest } from 'fastify';
import UserService from './user.service';

interface UserControllerDeps {
  userService: UserService;
}

export default class UserController {
  private readonly userService;

  constructor({ userService }: UserControllerDeps) {
    this.userService = userService;
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const { id: userId } = request.user;
    const user = await this.userService.getUserById(userId);

    if (!user) {
      reply.notFound();
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
