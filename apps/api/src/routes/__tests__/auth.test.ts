import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await app.prisma.refreshToken.deleteMany();
  await app.prisma.user.deleteMany();
});

describe('POST /auth/register', () => {
  it('creates a user and returns tokens', async () => {
    const res = await supertest(app.server)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('returns 400 if email already exists', async () => {
    await supertest(app.server)
      .post('/auth/register')
      .send({ email: 'dupe@example.com', password: 'password123' });
    const res = await supertest(app.server)
      .post('/auth/register')
      .send({ email: 'dupe@example.com', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 if password too short', async () => {
    const res = await supertest(app.server)
      .post('/auth/register')
      .send({ email: 'short@example.com', password: '123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  it('returns tokens with correct credentials', async () => {
    await supertest(app.server)
      .post('/auth/register')
      .send({ email: 'login@example.com', password: 'password123' });
    const res = await supertest(app.server)
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('returns 401 with wrong password', async () => {
    await supertest(app.server)
      .post('/auth/register')
      .send({ email: 'wrong@example.com', password: 'password123' });
    const res = await supertest(app.server)
      .post('/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/refresh', () => {
  it('returns new accessToken', async () => {
    const regRes = await supertest(app.server)
      .post('/auth/register')
      .send({ email: 'refresh@example.com', password: 'password123' });
    const res = await supertest(app.server)
      .post('/auth/refresh')
      .send({ refreshToken: regRes.body.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
});
