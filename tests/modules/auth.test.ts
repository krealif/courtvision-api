import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DbClient } from '@/infra/db';
import { users } from '@/infra/db/db.schema';
import { LoginResponse, SignupResponse } from '@/modules/auth/auth.schema';
import createServer from '@/server';

let server: FastifyInstance;
let db: DbClient;

beforeAll(async () => {
  server = await createServer();
  db = server.diContainer.resolve('db');
});

afterAll(async () => {
  await server.diContainer.dispose();
  await server.close();
});

describe('Register', () => {
  beforeAll(async () => {
    await db.delete(users);
  });

  it('should successfully register a new user', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Alice',
        email: 'alice1@example.com',
        password: 'Password123!',
      },
    });

    const savedUser = await db.query.users.findFirst({
      where: eq(users.email, 'alice1@example.com'),
    });

    expect(savedUser).toBeTruthy();
    expect(savedUser?.password).not.toBe('Password123!');

    const body: SignupResponse = response.json();

    expect(response.statusCode).toBe(201);
    expect(body.data).toHaveProperty('token');
    expect(body.data.user).toHaveProperty('email', 'alice1@example.com');
  });

  it('should fail when registering with existing email', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Alice Again',
        email: 'alice1@example.com',
        password: 'Password123!',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('Login', () => {
  beforeAll(async () => {
    await db.delete(users);

    await db.insert(users).values({
      name: 'Alice',
      email: 'alice1@example.com',
      password: '$2b$10$GPbxrbtKSoyJa/52ECuOH.m1gsDbVNaCPP3t7gvAOS0dIDw0Yclim',
    });
  });

  it('should successfully log in with valid credentials', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'alice1@example.com',
        password: 'Password123!',
      },
    });

    const body: LoginResponse = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.data).toHaveProperty('token');
  });

  it('should fail login with incorrect password', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'alice1@example.com',
        password: 'WrongPassword!',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});
