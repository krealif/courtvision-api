import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DbClient } from '@/infra/db';
import { users } from '@/infra/db/db.schema';
import { LoginResponse, SignupResponse } from '@/modules/auth/auth.schema';
import createServer from '@/server';
import { user1, user2 } from '../fixtures/data';

let server: FastifyInstance;
let db: DbClient;

beforeAll(async () => {
  server = await createServer();
  db = server.diContainer.resolve('db');
});

afterAll(async () => {
  await server.close();
});

describe('Register', () => {
  beforeEach(async () => {
    await db.delete(users);
  });

  it('should register a new user successfully', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: user1,
    });

    const body: SignupResponse = response.json();

    expect(response.statusCode).toBe(201);
    expect(body.data).toHaveProperty('token');
    expect(body.data.user).toHaveProperty('email', user1.email);

    const savedUser = await db.query.users.findFirst({
      where: eq(users.email, user1.email),
    });

    expect(savedUser).toBeTruthy();
    expect(savedUser?.password).not.toBe(user1.plainPassword);
  });

  it('should return an error when registering with an existing email', async () => {
    await db.insert(users).values({
      ...user1,
      password: '$2b$10$hashedexample',
    });

    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Alice Again',
        email: user1.email,
        password: user1.plainPassword,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty('error');
  });

  it('should return a validation error when data is invalid', async () => {
    const invalidPayloads = [
      { email: 'incomplete@example.com', password: 'pass123' },
      { name: 'No Email', password: 'pass123' },
      { name: 'No Password', email: 'no-password@example.com' },
    ];

    for (const payload of invalidPayloads) {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error');
      expect(response.json()).toHaveProperty('validationErrors');
    }
  });
});

describe('Login', () => {
  beforeEach(async () => {
    await db.delete(users);

    await db.insert(users).values(user1);
  });

  it('should log in successfully with valid credentials', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: user1.email,
        password: user1.plainPassword,
      },
    });

    const body: LoginResponse = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.data).toHaveProperty('token');
    expect(body.data.user).toHaveProperty('email', user1.email);
  });

  it('should return an error when is not registered', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: user2.email,
        password: user2.plainPassword,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });

  it('should return an error when password is incorrect', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: user1.email,
        password: user2.email,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });

  it('should return a validation error when data is invalid', async () => {
    const invalidPayloads = [
      { email: user1.email },
      { password: user1.plainPassword },
    ];

    for (const payload of invalidPayloads) {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error');
      expect(response.json()).toHaveProperty('validationErrors');
    }
  });
});
