import { FastifyReply, FastifyRequest } from 'fastify';
import S3Service from '../s3/s3.service';
import * as UserSchema from './user.schema';
import UserService from './user.service';

export default class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3Service: S3Service,
  ) {}

  async show(
    request: FastifyRequest<{ Reply: UserSchema.ShowUserResponse }>,
    reply: FastifyReply<{ Reply: UserSchema.ShowUserResponse }>,
  ) {
    const { id: userId } = request.user;
    const user = await this.userService.findById(userId);
    if (!user) return reply.notFound();

    return reply.code(200).send({
      statusCode: 200,
      message: 'User profile retrieved successfully.',
      data: {
        user: {
          ...user,
          photo_url: user.photo_url
            ? await this.s3Service.getPresignedDownloadUrl(user.photo_url)
            : undefined,
        },
      },
    });
  }

  async update(
    request: FastifyRequest<{
      Body: UserSchema.UpdateUserBody;
      Reply: UserSchema.ShowUserResponse;
    }>,
    reply: FastifyReply<{ Reply: UserSchema.ShowUserResponse }>,
  ) {
    const { id: userId } = request.user;
    const user = await this.userService.findById(userId);

    if (!user) return reply.notFound();

    const updatedUser = await this.userService.update(user, request.body);
    if (!updatedUser) return reply.internalServerError();

    return reply.code(200).send({
      statusCode: 200,
      message: 'User profile updated successfully.',
      data: {
        user: {
          ...updatedUser,
          photo_url: updatedUser.photo_url
            ? await this.s3Service.getPresignedDownloadUrl(
                updatedUser.photo_url,
              )
            : undefined,
        },
      },
    });
  }
}
