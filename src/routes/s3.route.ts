import { FastifyInstance } from 'fastify';
import S3Controller from '@/modules/s3/s3.controller';
import * as S3Schema from '@/modules/s3/s3.schema';
import ErrorSchema from '@/shared/error.schema';

export default function routes(app: FastifyInstance) {
  const s3Controller = app.diContainer.resolve<S3Controller>('s3Controller');

  app.post(
    '/s3/sign',
    {
      schema: {
        summary: 'Get pre-signed upload URL',
        description:
          'Returns a pre-signed URL that can be used to upload a file directly to S3',
        tags: ['S3'],
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
    s3Controller.createSignedUploadUrl.bind(s3Controller),
  );

  app.post(
    '/s3/multipart',
    {
      schema: {
        summary: 'Initiate a multipart upload process',
        description:
          'Starts a new multipart upload process and returns upload ID for subsequent operations',
        tags: ['S3'],
        security: [{ bearerAuth: [] }],
        body: S3Schema.MultipartUploadInitBodySchema,
        response: {
          200: S3Schema.MultipartUploadInitResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    s3Controller.initiateMultipartUpload.bind(s3Controller),
  );

  app.get(
    '/s3/multipart/:uploadId/:partNumber',
    {
      schema: {
        summary: 'Get pre-signed URL for uploading a specific part',
        description:
          'Returns a pre-signed URL for uploading a specific part number of a multipart upload',
        tags: ['S3'],
        security: [{ bearerAuth: [] }],
        params: S3Schema.MultipartUploadUrlParamsSchema,
        querystring: S3Schema.MultipartUploadUrlQuerySchema,
        response: {
          200: S3Schema.MultipartUploadUrlResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    s3Controller.createMultipartUploadUrl.bind(s3Controller),
  );

  app.get(
    '/s3/multipart/:uploadId',
    {
      schema: {
        summary: 'List all parts of a multipart upload',
        description:
          'Returns information about all parts that have been uploaded for a specific multipart upload',
        tags: ['S3'],
        security: [{ bearerAuth: [] }],
        params: S3Schema.UploadIdParamsSchema,
        querystring: S3Schema.ObjectKeyQuerySchema,
        response: {
          200: S3Schema.MultipartUploadPartsResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    s3Controller.listMultipartUploadParts.bind(s3Controller),
  );
  app.post(
    '/s3/multipart/:uploadId/complete',
    {
      schema: {
        summary: 'Complete a multipart upload',
        description:
          'Completes a multipart upload by assembling previously uploaded parts',
        tags: ['S3'],
        security: [{ bearerAuth: [] }],
        params: S3Schema.UploadIdParamsSchema,
        querystring: S3Schema.ObjectKeyQuerySchema,
        body: S3Schema.CompleteMultipartUploadBodySchema,
        response: {
          200: S3Schema.CompleteMultipartUploadResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    s3Controller.completeMultipartUpload.bind(s3Controller),
  );

  app.delete(
    '/s3/multipart/:uploadId',
    {
      schema: {
        summary: 'Abort a multipart upload',
        description:
          'Aborts a multipart upload and deletes any parts that have been uploaded',
        tags: ['S3'],
        security: [{ bearerAuth: [] }],
        params: S3Schema.UploadIdParamsSchema,
        querystring: S3Schema.ObjectKeyQuerySchema,
        response: {
          204: {
            description: 'Default Response',
            type: 'null',
          },
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    s3Controller.abortMultipartUpload.bind(s3Controller),
  );
}
