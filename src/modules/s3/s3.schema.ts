import { Static, Type } from '@sinclair/typebox';

const BaseUploadSchema = Type.Object({
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

const UploadIdParamSchema = Type.Object({
  uploadId: Type.String({
    description: 'Unique identifier for the multipart upload process',
  }),
});

const KeyQuerySchema = Type.Object({
  key: Type.String({ description: 'Object key/path in the S3 bucket' }),
});

// Signed Upload
export const SignedUploadBodySchema = BaseUploadSchema;
export type SignedUploadBody = Static<typeof SignedUploadBodySchema>;

// Multipart Upload Initiation
export const MultipartUploadBodySchema = Type.Object({
  ...BaseUploadSchema.properties,
  metadata: Type.Optional(
    Type.Record(Type.String(), Type.String(), {
      description: 'Optional metadata to be stored with the file',
    }),
  ),
});
export type MultipartUploadBody = Static<typeof MultipartUploadBodySchema>;

// Multipart Upload URL
export const MultipartUploadUrlParamsSchema = Type.Object({
  ...UploadIdParamSchema.properties,
  partNumber: Type.Number({
    description: 'The sequence number of the part being uploaded',
  }),
});
export type MultipartUploadUrlParams = Static<
  typeof MultipartUploadUrlParamsSchema
>;

export const MultipartUploadUrlQuerySchema = KeyQuerySchema;
export type MultipartUploadUrlQuery = Static<
  typeof MultipartUploadUrlQuerySchema
>;

// List Multipart Upload Parts
export const MultipartUploadPartsParamsSchema = UploadIdParamSchema;
export type MultipartUploadPartsParams = Static<
  typeof MultipartUploadPartsParamsSchema
>;

export const MultipartUploadPartsQuerySchema = KeyQuerySchema;
export type MultipartUploadPartsQuery = Static<
  typeof MultipartUploadPartsQuerySchema
>;

// Complete Multipart Upload

const UploadParts = Type.Array(
  Type.Object({
    PartNumber: Type.Number({ description: 'Number identifying the part' }),
    ETag: Type.String({
      description: 'Entity tag returned when the part was uploaded',
    }),
  }),
);

export const CompleteMultipartUploadBodySchema = Type.Object({
  parts: UploadParts,
});
export type CompleteMultipartUploadBody = Static<
  typeof CompleteMultipartUploadBodySchema
>;

export const CompleteMultipartUploadParamsSchema = UploadIdParamSchema;
export type CompleteMultipartUploadParams = Static<
  typeof CompleteMultipartUploadParamsSchema
>;

export const CompleteMultipartUploadQuerySchema = KeyQuerySchema;
export type CompleteMultipartUploadQuery = Static<
  typeof CompleteMultipartUploadQuerySchema
>;

// Abort Multipart Upload
export const AbortMultipartUploadParamsSchema = UploadIdParamSchema;
export type AbortMultipartUploadParams = Static<
  typeof AbortMultipartUploadParamsSchema
>;

export const AbortMultipartUploadQuerySchema = KeyQuerySchema;
export type AbortMultipartUploadQuery = Static<
  typeof AbortMultipartUploadQuerySchema
>;

// Response

export const SignedUploadResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    url: Type.String({ format: 'uri' }),
    method: Type.Literal('PUT'),
  }),
});

export const MultipartUploadResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    key: Type.Union([Type.String(), Type.Null()]),
    uploadId: Type.Union([Type.String(), Type.Null()]),
  }),
});

export const MultipartUploadUrlResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    url: Type.String({ format: 'uri' }),
    expiresIn: Type.Optional(Type.Number()),
  }),
});

export const MultipartUploadPartsResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  data: Type.Object({
    parts: UploadParts,
  }),
});

export const CompleteMultipartUploadResponseSchema = Type.Object({
  statusCode: Type.Literal(200),
  message: Type.String(),
  data: Type.Object({
    location: Type.Union([Type.String(), Type.Null()]),
  }),
});
