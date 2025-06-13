import { FastifyReply, FastifyRequest } from 'fastify';
import S3Service from '../s3/s3.service';
import {
  LoginBody,
  LoginResponse,
  SignupBody,
  SignupResponse,
} from './auth.schema';
import AuthService from './auth.service';

export default class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly s3Service: S3Service,
  ) {}

  async login(
    request: FastifyRequest<{ Body: LoginBody; Reply: LoginResponse }>,
    reply: FastifyReply<{ Reply: LoginResponse }>,
  ) {
    const user = await this.authService.verify(request.body);

    if (!user) return reply.unauthorized('Invalid credentials.');

    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
    });

    return reply.code(200).send({
      statusCode: 200,
      message: 'Login successful.',
      data: {
        user: {
          ...user,
          photo_url: user.photo_url
            ? await this.s3Service.getPresignedDownloadUrl(user.photo_url)
            : undefined,
        },
        token,
      },
    });
  }

  async signup(
    request: FastifyRequest<{ Body: SignupBody; Reply: SignupResponse }>,
    reply: FastifyReply<{ Reply: SignupResponse }>,
  ) {
    const user = await this.authService.create(request.body);

    if (!user) return reply.internalServerError();

    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
    });

    return reply.code(201).send({
      statusCode: 201,
      message: 'User registered successfully.',
      data: {
        user: {
          ...user,
          photo_url: undefined,
        },
        token,
      },
    });
  }
}
