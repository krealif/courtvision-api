import crypto from 'node:crypto';
import path from 'path';
import slugify from 'slugify';
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CompletedPart,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/config';

interface S3ServiceDeps {
  s3: S3Client;
}

export default class S3Service {
  private readonly s3;
  private readonly bucketName;

  constructor({ s3 }: S3ServiceDeps) {
    this.s3 = s3;
    this.bucketName = env.S3_BUCKET;
  }

  private generateObjectKey(filename: string): string {
    const uuid = crypto.randomUUID();
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);

    const slug = slugify(nameWithoutExt, { lower: true, strict: true });
    const truncatedSlug = slug.slice(0, 128);

    return `${truncatedSlug}-${uuid}${ext}`;
  }

  /**
   * Generate a signed URL for direct upload to S3
   */
  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<{ url: string; method: 'PUT' }> {
    const key = this.generateObjectKey(filename);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3, command, {
      expiresIn,
    });

    return {
      url,
      method: 'PUT',
    };
  }

  /**
   * Initiate a multipart upload
   */
  async createMultipartUpload(
    filename: string,
    contentType: string,
    metadata?: Record<string, string>,
  ) {
    const key = this.generateObjectKey(filename);

    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      Metadata: metadata,
    });

    const result = await this.s3.send(command);

    return {
      key: result.Key ?? null,
      uploadId: result.UploadId ?? null,
    };
  }

  /**
   * Get a signed URL for uploading a specific part
   */
  async getPresignedUploadPartUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresIn?: number,
  ) {
    const command = new UploadPartCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: '',
    });

    const url = await getSignedUrl(this.s3, command, {
      expiresIn,
    });

    return {
      url,
      expiresIn,
    };
  }

  /**
   * List all parts of a multipart upload
   */
  async listMultipartUploadParts(
    key: string,
    uploadId: string,
  ): Promise<CompletedPart[]> {
    const parts: CompletedPart[] = [];

    const listPartsRecursively = async (marker?: string): Promise<void> => {
      const command = new ListPartsCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: marker,
      });

      const result = await this.s3.send(command);

      if (result.Parts) {
        parts.push(...result.Parts);
      }

      if (result.IsTruncated && result.NextPartNumberMarker !== undefined) {
        await listPartsRecursively(result.NextPartNumberMarker);
      }
    };

    await listPartsRecursively();
    return parts;
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: CompletedPart[],
  ) {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    const result = await this.s3.send(command);
    return {
      location: result.Location ?? null,
    };
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
    });

    await this.s3.send(command);
  }

  /**
   * Generate a signed URL to temporarily access (download) an object from S3
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn?: number, // in seconds, e.g., 3600 for 1 hour
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(this.s3, command, {
      expiresIn,
    });

    return url;
  }
}
