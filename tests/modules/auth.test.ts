import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DbClient } from '@/infra/db';
import { users } from '@/infra/db/db.schema';
import { LoginResponse, SignupResponse } from '@/modules/auth/auth.schema';
import createServer from '@/server';

let server: FastifyInstance;
let db: DbClient;

const testUser = {
  name: 'Alice',
  email: 'alice1@example.com',
  password: 'Password123!',
};

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

  it('should successfully register a new user', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: testUser,
    });

    const savedUser = await db.query.users.findFirst({
      where: eq(users.email, testUser.email),
    });

    expect(savedUser).toBeTruthy();
    expect(savedUser?.password).not.toBe(testUser.password);

    const body: SignupResponse = response.json();

    expect(response.statusCode).toBe(201);
    expect(body.data).toHaveProperty('token');
    expect(body.data.user).toHaveProperty('email', testUser.email);
  });

  it('should fail when registering with existing email', async () => {
    await db.insert(users).values({
      ...testUser,
      password: '$2b$10$hashedexample',
    });

    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Alice Again',
        email: testUser.email,
        password: testUser.password,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty('error');
  });
});

describe('Login', () => {
  beforeEach(async () => {
    await db.delete(users);

    await db.insert(users).values({
      ...testUser,
      password: '$2b$10$GPbxrbtKSoyJa/52ECuOH.m1gsDbVNaCPP3t7gvAOS0dIDw0Yclim',
    });
  });

  it('should successfully log in with valid credentials', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    const body: LoginResponse = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.data).toHaveProperty('token');
    expect(body.data.user).toHaveProperty('email', testUser.email);
  });

  it('should fail login with incorrect password', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: testUser.email,
        password: 'WrongPassword!',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });
});
