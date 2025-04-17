import { FastifyReply, FastifyRequest } from 'fastify';
import * as S3Schema from './s3.schema';
import S3Service from './s3.service';

interface S3ControllerDeps {
  s3Service: S3Service;
}

export default class S3Controller {
  private readonly s3Service;

  constructor({ s3Service }: S3ControllerDeps) {
    this.s3Service = s3Service;
  }

  async createSignedUploadUrl(
    request: FastifyRequest<{ Body: S3Schema.SignedUploadBody }>,
    reply: FastifyReply,
  ) {
    const { filename, contentType } = request.body;

    const signedUrl = await this.s3Service.getSignedUploadUrl(
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

  async initiateMultipartUpload(
    request: FastifyRequest<{ Body: S3Schema.MultipartUploadBody }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { filename, contentType, metadata } = request.body;

    const uploadDetails = await this.s3Service.initiateMultipartUpload(
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

  async createMultipartUploadUrl(
    request: FastifyRequest<{
      Params: S3Schema.MultipartUploadUrlParams;
      Querystring: S3Schema.MultipartUploadUrlQuery;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { uploadId, partNumber } = request.params;
    const { key } = request.query;

    const result = await this.s3Service.getMultipartUploadUrl(
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
      Params: S3Schema.MultipartUploadPartsParams;
      Querystring: S3Schema.MultipartUploadPartsQuery;
    }>,
    reply: FastifyReply,
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
      Params: S3Schema.CompleteMultipartUploadParams;
      Querystring: S3Schema.CompleteMultipartUploadQuery;
    }>,
    reply: FastifyReply,
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
      Params: S3Schema.AbortMultipartUploadParams;
      Querystring: S3Schema.AbortMultipartUploadQuery;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { uploadId } = request.params;
    const { key } = request.query;

    await this.s3Service.abortMultipartUpload(key, uploadId);
    reply.code(204).send();
  }
}
