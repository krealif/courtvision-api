import { Static, Type } from '@sinclair/typebox';

/**
 * Request Schema
 */
const BaseObjectSchema = Type.Object({
  filename: Type.String({
    minLength: 1,
    maxLength: 128,
    description: 'The name of the file being uploaded.',
  }),
  contentType: Type.String({
    minLength: 1,
    description: 'The MIME type of the file being uploaded.',
    examples: ['video/mp4'],
  }),
});

export const UploadIdParamsSchema = Type.Object({
  uploadId: Type.String({
    description:
      'The unique identifier for an existing multipart upload process.',
  }),
});
export type UploadIdParams = Static<typeof UploadIdParamsSchema>;

export const ObjectKeyQuerySchema = Type.Object({
  key: Type.String({ description: 'The object key/path in the S3 bucket.' }),
});
export type ObjectKeyQuery = Static<typeof ObjectKeyQuerySchema>;

// Presigned Upload
export const PresignedUploadBodySchema = BaseObjectSchema;
export type PresignedUploadBody = Static<typeof PresignedUploadBodySchema>;

// Multipart Upload Initiation
export const CreateMultipartUploadBodySchema = Type.Object({
  ...BaseObjectSchema.properties,
  metadata: Type.Optional(
    Type.Record(Type.String(), Type.String(), {
      description:
        'A set of key-value pairs that can be attached to the object. This can be useful for storing additional information about the file.',
    }),
  ),
});
export type CreateMultipartUploadBody = Static<
  typeof CreateMultipartUploadBodySchema
>;

// Multipart Upload URL
export const PresignedUploadPartUrlParamsSchema = Type.Object({
  ...UploadIdParamsSchema.properties,
  partNumber: Type.Number({
    description:
      'The sequential number identifying which part of the file this URL will be used to upload.',
  }),
});
export type PresignedUploadPartUrlParams = Static<
  typeof PresignedUploadPartUrlParamsSchema
>;

export const PresignedUploadPartUrlQuerySchema = ObjectKeyQuerySchema;
export type PresignedUploadPartUrlQuery = Static<
  typeof PresignedUploadPartUrlQuerySchema
>;

// Complete Multipart Upload
const CompletedParts = Type.Array(
  Type.Object({
    PartNumber: Type.Optional(
      Type.Number({
        description:
          'The sequential number identifying the part of the multipart upload.',
      }),
    ),
    ETag: Type.Optional(
      Type.String({
        description:
          'The entity tag returned when the part was successfully uploaded.',
      }),
    ),
  }),
);

export const CompleteMultipartUploadBodySchema = Type.Object({
  parts: CompletedParts,
});
export type CompleteMultipartUploadBody = Static<
  typeof CompleteMultipartUploadBodySchema
>;

/**
 * Response Schema
 */
export const PresignedUploadResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    url: Type.String({
      format: 'uri',
      description:
        'The presigned URL to upload the object. Valid for a limited time period.',
    }),
    method: Type.Literal('PUT', {
      description:
        'The HTTP method to use when making a request to the presigned URL.',
    }),
  }),
});
export type PresignedUploadResponse = Static<
  typeof PresignedUploadResponseSchema
>;

export const CreateMultipartUploadResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    key: Type.Union([Type.String(), Type.Null()], {
      description:
        'The object key assigned by S3. Null if the upload could not be initiated.',
    }),
    uploadId: Type.Union([Type.String(), Type.Null()], {
      description:
        'The unique identifier for this multipart upload process, used in subsequent operations.',
    }),
  }),
});
export type CreateMultipartUploadResponse = Static<
  typeof CreateMultipartUploadResponseSchema
>;

export const PresignedUploadPartUrlSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    url: Type.String({
      format: 'uri',
      description:
        'The presigned URL to upload a specific part of the multipart upload.',
    }),
    expiresIn: Type.Optional(
      Type.Number({
        description:
          'The time in seconds until the presigned part URL expires.',
      }),
    ),
  }),
});
export type PresignedUploadPartUrlResponse = Static<
  typeof PresignedUploadPartUrlSchema
>;

export const MultipartUploadPartsResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object(
    {
      parts: CompletedParts,
    },
    {
      description:
        'The data payload containing the list of successfully uploaded parts in this multipart upload.',
    },
  ),
});
export type MultipartUploadPartsResponse = Static<
  typeof MultipartUploadPartsResponseSchema
>;

export const CompleteMultipartUploadResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    location: Type.Union([Type.String(), Type.Null()], {
      description:
        'The URL of the completed S3 object. Null if the URL is not available or the upload completion failed.',
    }),
  }),
});
export type CompleteMultipartUploadResponse = Static<
  typeof CompleteMultipartUploadResponseSchema
>;
