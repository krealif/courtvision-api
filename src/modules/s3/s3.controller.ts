import { FastifyReply, FastifyRequest } from 'fastify';
import * as S3Schema from './s3.schema';
import S3Service from './s3.service';

export default class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  async getPresignedUploadUrl(
    request: FastifyRequest<{
      Body: S3Schema.PresignedUploadBody;
      Reply: S3Schema.PresignedUploadResponse;
    }>,
    reply: FastifyReply<{ Reply: S3Schema.PresignedUploadResponse }>,
  ) {
    const { filename, contentType } = request.body;

    const signedUrl = await this.s3Service.getPresignedUploadUrl(
      filename,
      contentType,
    );

    return reply.code(200).send({
      statusCode: 200,
      message: 'Signed upload URL created successfully',
      data: {
        ...signedUrl,
      },
    });
  }

  async createMultipartUpload(
    request: FastifyRequest<{
      Body: S3Schema.CreateMultipartUploadBody;
      Reply: S3Schema.CreateMultipartUploadResponse;
    }>,
    reply: FastifyReply<{
      Reply: S3Schema.CreateMultipartUploadResponse;
    }>,
  ): Promise<void> {
    const { filename, contentType, metadata } = request.body;

    const uploadDetails = await this.s3Service.createMultipartUpload(
      filename,
      contentType,
      metadata,
    );

    return reply.code(200).send({
      statusCode: 200,
      message: 'Multipart upload initiated successfully',
      data: {
        ...uploadDetails,
      },
    });
  }

  async getPresignedUploadPartUrl(
    request: FastifyRequest<{
      Params: S3Schema.PresignedUploadPartUrlParams;
      Querystring: S3Schema.PresignedUploadPartUrlQuery;
      Reply: S3Schema.PresignedUploadPartUrlResponse;
    }>,
    reply: FastifyReply<{ Reply: S3Schema.PresignedUploadPartUrlResponse }>,
  ): Promise<void> {
    const { uploadId, partNumber } = request.params;
    const { key } = request.query;

    const result = await this.s3Service.getPresignedUploadPartUrl(
      key,
      uploadId,
      partNumber,
    );

    return reply.code(200).send({
      statusCode: 200,
      message: `Upload URL for part ${partNumber} generated successfully`,
      data: {
        ...result,
      },
    });
  }

  async listMultipartUploadParts(
    request: FastifyRequest<{
      Params: S3Schema.UploadIdParams;
      Querystring: S3Schema.ObjectKeyQuery;
      Reply: S3Schema.MultipartUploadPartsResponse;
    }>,
    reply: FastifyReply<{ Reply: S3Schema.MultipartUploadPartsResponse }>,
  ): Promise<void> {
    const { uploadId } = request.params;
    const { key } = request.query;

    const parts = await this.s3Service.listMultipartUploadParts(uploadId, key);

    return reply.code(200).send({
      statusCode: 200,
      message: 'Multipart upload parts retrieved successfully',
      data: {
        parts,
      },
    });
  }

  async completeMultipartUpload(
    request: FastifyRequest<{
      Body: S3Schema.CompleteMultipartUploadBody;
      Params: S3Schema.UploadIdParams;
      Querystring: S3Schema.ObjectKeyQuery;
      Reply: S3Schema.CompleteMultipartUploadResponse;
    }>,
    reply: FastifyReply<{ Reply: S3Schema.CompleteMultipartUploadResponse }>,
  ): Promise<void> {
    const { parts } = request.body;
    const { uploadId } = request.params;
    const { key } = request.query;

    const result = await this.s3Service.completeMultipartUpload(
      key,
      uploadId,
      parts,
    );

    return reply.code(200).send({
      statusCode: 200,
      message: 'Multipart upload completed successfully',
      data: {
        ...result,
      },
    });
  }

  async abortMultipartUpload(
    request: FastifyRequest<{
      Params: S3Schema.UploadIdParams;
      Querystring: S3Schema.ObjectKeyQuery;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { uploadId } = request.params;
    const { key } = request.query;

    await this.s3Service.abortMultipartUpload(key, uploadId);
    reply.code(204).send();
  }
}
