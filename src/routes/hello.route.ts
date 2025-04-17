import { FastifyInstance } from 'fastify';

export default function routes(app: FastifyInstance) {
  app.get('/hello', () => {
    return 'Hello world!';
  });
}
