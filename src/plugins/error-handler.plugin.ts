import fp from 'fastify-plugin';
import { NodeEnv, env } from '@/config';
import { DbValidationError } from '@/utils/db-validator.util';
import { formatValidationErrors } from '@/utils/validation-formatter.util';

/**
 * Global error handler plugin for Fastify.
 */
export default fp((fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = error.statusCode ?? 500;

    if (
      error instanceof DbValidationError ||
      (error.validation && error.validationContext === 'body')
    ) {
      const validationErrors =
        error instanceof DbValidationError
          ? error.errors
          : formatValidationErrors(error.validation ?? []);

      return reply.status(400).send({
        statusCode: 400,
        code: 'FST_ERR_VALIDATION',
        error: 'Bad Request',
        message: 'The request could not be processed due to validation errors.',
        validationErrors,
      });
    }

    if (statusCode === 500 && env.NODE_ENV === NodeEnv.production) {
      error.message =
        'An unexpected error occurred while processing your request.';
    }

    return reply.send(error);
  });
});
