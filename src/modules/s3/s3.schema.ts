import { Static, Type } from '@sinclair/typebox';

/**
 * Request Schema
 */
const BaseObjectSchema = Type.Object({
  filename: Type.String({
    minLength: 1,
    maxLength: 128,
    description: 'Name of the file to be uploaded',
  }),
  contentType: Type.String({
    minLength: 1,
    description: 'MIME type of the file',
  }),
});

export const UploadIdParamsSchema = Type.Object({
  uploadId: Type.String({
    description: 'Unique identifier for the multipart upload process',
  }),
});
export type UploadIdParams = Static<typeof UploadIdParamsSchema>;

export const ObjectKeyQuerySchema = Type.Object({
  key: Type.String({ description: 'Object key/path in the S3 bucket' }),
});
export type ObjectKeyQuery = Static<typeof ObjectKeyQuerySchema>;

// Presigned Upload
export const PresignedUploadBodySchema = BaseObjectSchema;
export type PresignedUploadBody = Static<typeof PresignedUploadBodySchema>;

// Multipart Upload Initiation
export const MultipartUploadInitBodySchema = Type.Object({
  ...BaseObjectSchema.properties,
  metadata: Type.Optional(
    Type.Record(Type.String(), Type.String(), {
      description: 'Optional metadata to be stored with the file',
    }),
  ),
});
export type MultipartUploadInitBody = Static<
  typeof MultipartUploadInitBodySchema
>;

// Multipart Upload URL
export const MultipartUploadUrlParamsSchema = Type.Object({
  ...UploadIdParamsSchema.properties,
  partNumber: Type.Number({
    description: 'The sequence number of the part being uploaded',
  }),
});
export type MultipartUploadUrlParams = Static<
  typeof MultipartUploadUrlParamsSchema
>;

export const MultipartUploadUrlQuerySchema = ObjectKeyQuerySchema;
export type MultipartUploadUrlQuery = Static<
  typeof MultipartUploadUrlQuerySchema
>;

// Complete Multipart Upload
const CompletedParts = Type.Array(
  Type.Object({
    PartNumber: Type.Optional(
      Type.Number({ description: 'Number identifying the part' }),
    ),
    ETag: Type.Optional(
      Type.String({
        description: 'Entity tag returned when the part was uploaded',
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
    url: Type.String({ format: 'uri' }),
    method: Type.Literal('PUT'),
  }),
});
export type PresignedUploadResponse = Static<
  typeof PresignedUploadResponseSchema
>;

export const MultipartUploadInitResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    key: Type.Union([Type.String(), Type.Null()]),
    uploadId: Type.Union([Type.String(), Type.Null()]),
  }),
});
export type MultipartUploadInitResponse = Static<
  typeof MultipartUploadInitResponseSchema
>;

export const MultipartUploadUrlResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    url: Type.String({ format: 'uri' }),
    expiresIn: Type.Optional(Type.Number()),
  }),
});
export type MultipartUploadUrlResponse = Static<
  typeof MultipartUploadUrlResponseSchema
>;

export const MultipartUploadPartsResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    parts: CompletedParts,
  }),
});
export type MultipartUploadPartsResponse = Static<
  typeof MultipartUploadPartsResponseSchema
>;

export const CompleteMultipartUploadResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    location: Type.Union([Type.String(), Type.Null()]),
  }),
});
export type CompleteMultipartUploadResponse = Static<
  typeof CompleteMultipartUploadResponseSchema
>;
