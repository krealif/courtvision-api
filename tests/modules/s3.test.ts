import path from 'node:path';
import { FastifyInstance } from 'fastify';
import fs from 'fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { DbClient } from '@/infra/db';
import { users } from '@/infra/db/db.schema';
import { PresignedUploadResponse } from '@/modules/s3/s3.schema';
import createServer from '@/server';

let server: FastifyInstance;
let db: DbClient;
let s3: S3Client;
let token: string;

const testUser = {
  name: 'Alice',
  email: 'alice1@example.com',
  password: 'Password123!',
};

beforeAll(async () => {
  server = await createServer();
  db = server.diContainer.resolve('db');
  s3 = server.diContainer.resolve('s3');
});

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await db.delete(users);

  const [result] = await db.insert(users).values(testUser);

  token = server.jwt.sign({
    id: result.insertId,
    email: testUser.email,
  });
});

describe('File Upload', () => {
  beforeEach(async () => {
    await db.delete(users);
  });

  it('should return a valid presigned URL', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/s3/upload/presign',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        filename: 'avatar.png',
        contentType: 'image/png',
      },
    });

    const body: PresignedUploadResponse = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.data).toHaveProperty('method', 'PUT');
    const presignedUrl = body.data.url;
    expect(typeof presignedUrl).toBe('string');
    expect(() => new URL(presignedUrl)).not.toThrow();
  });

  it('should upload a file successfully using the presigned URL', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/s3/upload/presign',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        filename: 'avatar.png',
        contentType: 'image/png',
      },
    });

    const body: PresignedUploadResponse = response.json();
    const presignedUrl = body.data.url;

    const urlObj = new URL(presignedUrl);
    const bucket = urlObj.pathname.split('/')[1];
    const key = decodeURIComponent(urlObj.pathname.replace(/^\/[^/]+\//, ''));

    const filePath = path.join(__dirname, '../fixtures/avatar.png');
    const fileBuffer = await fs.readFile(filePath);
    const contentType = 'image/png';

    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': contentType,
      },
    });

    expect(uploadRes.status).toBe(200);

    const headResult = await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    expect(headResult).toBeDefined();
    expect(headResult.ContentLength).toBe(fileBuffer.length);

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  });

  it('should deny access when the user is unauthenticated', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/s3/upload/presign',
      payload: {
        filename: 'avatar.png',
        contentType: 'image/png',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });

  it('should return a validation error when data is incomplete', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/s3/upload/presign',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        // filename
        contentType: 'image/png',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty('error');
    expect(response.json()).toHaveProperty('validationErrors');
  });
});
