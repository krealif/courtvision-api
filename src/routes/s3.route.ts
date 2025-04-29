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

  app.post(
    '/s3/upload/multipart',
    {
      schema: {
        summary: 'Initialize a multipart upload',
        description:
          'Starts a new multipart upload process for large files and returns an upload ID. This ID is used for subsequent part uploads and to complete or abort the process.',
        tags: ['S3 Storage'],
        security: [{ bearerAuth: [] }],
        body: S3Schema.CreateMultipartUploadBodySchema,
        response: {
          200: S3Schema.CreateMultipartUploadResponseSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    s3Controller.createMultipartUpload.bind(s3Controller),
  );

  app.get(
    '/s3/upload/multipart/:uploadId/:partNumber',
    {
      schema: {
        summary: 'Create presigned part upload URL',
        description:
          'Generates a presigned URL to upload a specific part of a multipart upload. The URL is valid for a limited time and should be used to upload the corresponding part directly to storage.',
        tags: ['S3 Storage'],
        security: [{ bearerAuth: [] }],
        params: S3Schema.PresignedUploadPartUrlParamsSchema,
        querystring: S3Schema.PresignedUploadPartUrlQuerySchema,
        response: {
          200: S3Schema.PresignedUploadPartUrlSchema,
          401: ErrorSchema.UnauthorizedError,
          500: ErrorSchema.InternalServerError,
        },
      },
      preHandler: [app.authenticate()],
    },
    s3Controller.getPresignedUploadPartUrl.bind(s3Controller),
  );

  app.get(
    '/s3/upload/multipart/:uploadId',
    {
      schema: {
        summary: 'List all parts of a multipart upload',
        description:
          'Returns a list of all parts that have been successfully uploaded for a specific multipart upload, including their part numbers and ETags.',
        tags: ['S3 Storage'],
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
    '/s3/upload/multipart/:uploadId/complete',
    {
      schema: {
        summary: 'Complete a multipart upload',
        description:
          'Completes the multipart upload by assembling previously uploaded parts into the final object. This must be called after all parts have been successfully uploaded',
        tags: ['S3 Storage'],
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
    '/s3/upload/multipart/:uploadId',
    {
      schema: {
        summary: 'Abort a multipart upload',
        description:
          'Aborts a multipart upload and deletes any parts that have been uploaded.',
        tags: ['S3 Storage'],
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
