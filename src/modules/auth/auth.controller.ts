import { FastifyReply, FastifyRequest } from 'fastify';
import {
  LoginBody,
  LoginResponse,
  SignupBody,
  SignupResponse,
} from './auth.schema';
import AuthService from './auth.service';

interface AuthControllerDeps {
  authService: AuthService;
}

export default class AuthController {
  private readonly authService;

  constructor({ authService }: AuthControllerDeps) {
    this.authService = authService;
  }

  async login(
    request: FastifyRequest<{ Body: LoginBody; Reply: LoginResponse }>,
    reply: FastifyReply<{ Reply: LoginResponse }>,
  ) {
    const user = await this.authService.verify(request.body);

    if (!user) {
      return reply.unauthorized('Invalid credentials.');
    }

    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
    });

    return reply.code(200).send({
      statusCode: 200,
      message: 'Login successful.',
      data: {
        user,
        token,
      },
    });
  }

  async signup(
    request: FastifyRequest<{ Body: SignupBody; Reply: SignupResponse }>,
    reply: FastifyReply<{ Reply: SignupResponse }>,
  ) {
    const user = await this.authService.create(request.body);

    if (!user) {
      return reply.internalServerError();
    }

    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
    });

    return reply.code(201).send({
      statusCode: 201,
      message: 'User registered successfully.',
      data: {
        user,
        token,
      },
    });
  }
}
