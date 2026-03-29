import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let accessToken: string;

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await app.prisma.checkResult.deleteMany();
  await app.prisma.incident.deleteMany();
  await app.prisma.monitor.deleteMany();
  await app.prisma.refreshToken.deleteMany();
  await app.prisma.user.deleteMany();

  const res = await supertest(app.server)
    .post('/auth/register')
    .send({ email: 'monitor@example.com', password: 'password123' });
  accessToken = res.body.accessToken;
});

describe('GET /monitors', () => {
  it('returns 401 without token', async () => {
    const res = await supertest(app.server).get('/monitors');
    expect(res.status).toBe(401);
  });
});

describe('POST /monitors', () => {
  it('creates a monitor when authenticated', async () => {
    const res = await supertest(app.server)
      .post('/monitors')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Monitor', url: 'https://example.com' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Monitor');
  });
});

describe('GET /monitors (with data)', () => {
  it('returns the created monitor', async () => {
    await supertest(app.server)
      .post('/monitors')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Monitor', url: 'https://example.com' });
    const res = await supertest(app.server)
      .get('/monitors')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('GET /monitors/:id', () => {
  it('returns 404 for non-existent monitor', async () => {
    const res = await supertest(app.server)
      .get('/monitors/nonexistent-id')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /monitors/:id', () => {
  it('deletes the monitor', async () => {
    const createRes = await supertest(app.server)
      .post('/monitors')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'To Delete', url: 'https://example.com' });
    const res = await supertest(app.server)
      .delete(`/monitors/${createRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
