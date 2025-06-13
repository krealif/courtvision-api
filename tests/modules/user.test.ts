import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { DbClient } from '@/infra/db';
import { users } from '@/infra/db/db.schema';
import { ShowUserResponse } from '@/modules/user/user.schema';
import createServer from '@/server';

let server: FastifyInstance;
let token: string;

const userData = {
  name: 'Alice',
  email: 'alice2@example.com',
  password: '$2b$10$GPbxrbtKSoyJa/52ECuOH.m1gsDbVNaCPP3t7gvAOS0dIDw0Yclim',
};

beforeAll(async () => {
  server = await createServer();
  const db = server.diContainer.resolve<DbClient>('db');

  await db.delete(users);
  const [result] = await db.insert(users).values(userData);

  token = server.jwt.sign({
    id: result.insertId,
    email: userData.email,
  });
});

afterAll(async () => {
  await server.diContainer.dispose();
  await server.close();
});

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
  expect(body.data.user).toHaveProperty('email', userData.email);
});

it('should return 401 if not authenticated', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/api/users/profile',
  });

  expect(response.statusCode).toBe(401);
});

it('should update user profile', async () => {
  const response = await server.inject({
    method: 'PUT',
    url: '/api/users/profile',
    payload: {
      name: 'Alice Updated',
      photo_url: 'https://minio.test/cv/avatar.png',
    },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  const body: ShowUserResponse = response.json();

  expect(response.statusCode).toBe(200);
  expect(body.data.user).toHaveProperty('name', 'Alice Updated');
  expect(body.data.user).toHaveProperty('email', userData.email);

  const photoUrl = body.data.user.photo_url;

  if (photoUrl) {
    expect(typeof photoUrl).toBe('string');
    expect(() => new URL(photoUrl)).not.toThrow();
  }
});
