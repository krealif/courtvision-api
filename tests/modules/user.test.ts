import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DbClient } from '@/infra/db';
import { users } from '@/infra/db/db.schema';
import { ShowUserResponse } from '@/modules/user/user.schema';
import createServer from '@/server';
import { user1, user2 } from '../fixtures/data';

let server: FastifyInstance;
let db: DbClient;
let token: string;

beforeAll(async () => {
  server = await createServer();
  db = server.diContainer.resolve('db');
});

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await db.delete(users);

  const [result] = await db.insert(users).values(user1);

  token = server.jwt.sign({
    id: result.insertId,
    email: user1.email,
  });
});

describe('Retrieve Profile', () => {
  it('should return user profile when authenticated', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/users/profile',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const body: ShowUserResponse = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.data.user).toHaveProperty('email', user1.email);
  });

  it('should deny access when the user is unauthenticated', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/users/profile',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });
});

describe('Edit Profile', () => {
  it('should update user profile successfully', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: '/api/users/profile',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: 'Alice Updated',
        photo_url: 'https://minio.test/cv/avatar.png',
      },
    });

    expect(response.statusCode).toBe(200);

    const body: ShowUserResponse = response.json();
    expect(body.data.user).toHaveProperty('name', 'Alice Updated');
    expect(body.data.user).toHaveProperty('email', user1.email);

    const photoUrl = body.data.user.photo_url;
    expect(typeof photoUrl).toBe('string');
    expect(() => new URL(photoUrl!)).not.toThrow();
  });

  it('should deny access when the user is unauthenticated', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: '/api/users/profile',
      payload: {
        name: 'Anonymous Update',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });

  it('should return an error when updating with an existing email', async () => {
    await db.insert(users).values(user2);

    const response = await server.inject({
      method: 'PUT',
      url: '/api/users/profile',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: 'Alice Updated',
        email: user2.email,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty('error');
  });

  it('should return a validation error when data is invalid', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: '/api/users/profile',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: 'Alice Updated',
        photo_url: 'not-a-valid-url',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty('error');
    expect(response.json()).toHaveProperty('validationErrors');
  });
});
