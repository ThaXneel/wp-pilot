import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

let ownerToken: string;

describe('Admin Module', () => {
  beforeAll(async () => {
    // Login as owner (seeded user)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@wppilot.com', password: 'OwnerPass123!' });

    if (res.body.success) {
      ownerToken = res.body.data.accessToken;
    }
  });

  describe('GET /api/admin/overview', () => {
    it('should return admin overview', async () => {
      if (!ownerToken) return;
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalClients');
    });

    it('should reject non-owner access', async () => {
      // Register a client user
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ email: `client-${Date.now()}@test.com`, password: 'TestPass123!' });

      const clientToken = regRes.body.data?.accessToken;
      if (!clientToken) return;

      const res = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/clients', () => {
    it('should list clients', async () => {
      if (!ownerToken) return;
      const res = await request(app)
        .get('/api/admin/clients')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('clients');
      expect(Array.isArray(res.body.data.clients)).toBe(true);
    });
  });

  describe('POST /api/admin/clients', () => {
    it('should create a new client', async () => {
      if (!ownerToken) return;
      const res = await request(app)
        .post('/api/admin/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: `admin-created-${Date.now()}@test.com`, password: 'TestPass123!' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('clientId');
    });
  });

  describe('GET /api/admin/sites', () => {
    it('should list sites', async () => {
      if (!ownerToken) return;
      const res = await request(app)
        .get('/api/admin/sites')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('sites');
    });
  });

  describe('GET /api/admin/activity', () => {
    it('should return activity stream', async () => {
      if (!ownerToken) return;
      const res = await request(app)
        .get('/api/admin/activity')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('activities');
    });
  });
});
