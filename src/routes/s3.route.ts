import { FastifyInstance } from 'fastify';
import S3Controller from '@/modules/s3/s3.controller';
import * as S3Schema from '@/modules/s3/s3.schema';
import ErrorSchema from '@/shared/error.schema';

export default function routes(app: FastifyInstance) {
  const s3Controller = app.diContainer.resolve<S3Controller>('s3Controller');

  app.post(
    '/s3/upload/presign',
    {
      schema: {
        summary: 'Create presigned upload URL',
        description:
          'Generates a presigned URL that can be used to upload an object directly to storage. The URL is valid for a limited time and must be used with a PUT request.',
        tags: ['S3 Storage'],
        security: [{ bearerAuth: [] }],
        body: S3Schema.PresignedUploadBodySchema,
        response: {
          200: S3Schema.PresignedUploadResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    s3Controller.getPresignedUploadUrl.bind(s3Controller),
  );
}
