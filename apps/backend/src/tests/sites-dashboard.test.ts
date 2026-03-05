import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../index.js';

const prisma = new PrismaClient();

let clientToken: string;
let clientId: string;
let siteId1: string;
let siteId2: string;

const clientEmail = `sites-test-${Date.now()}@example.com`;
const clientPassword = 'TestPassword123!';

describe('Sites & Dashboard Module', () => {
  beforeAll(async () => {
    // Register a client user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: clientEmail, password: clientPassword });

    expect(regRes.status).toBe(201);
    clientToken = regRes.body.data.accessToken;

    // Get the client ID from the user's profile
    const user = await prisma.user.findUnique({
      where: { email: clientEmail },
      include: { client: true },
    });
    clientId = user!.client!.id;

    // Create two test sites directly in the DB (simulating handshake completion)
    const site1 = await prisma.clientSite.create({
      data: {
        clientId,
        name: 'Test Site Alpha',
        wpUrl: 'https://alpha.example.com',
        apiToken: 'test-token-alpha-' + Date.now(),
        status: 'ONLINE',
        healthScore: 100,
      },
    });
    siteId1 = site1.id;

    const site2 = await prisma.clientSite.create({
      data: {
        clientId,
        name: 'Test Site Beta',
        wpUrl: 'https://beta.example.com',
        apiToken: 'test-token-beta-' + Date.now(),
        status: 'ONLINE',
        healthScore: 85,
      },
    });
    siteId2 = site2.id;
  });

  describe('GET /api/sites', () => {
    it('should return all sites for the authenticated client', async () => {
      const res = await request(app)
        .get('/api/sites')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify both test sites are returned
      const siteIds = res.body.data.map((s: { id: string }) => s.id);
      expect(siteIds).toContain(siteId1);
      expect(siteIds).toContain(siteId2);
    });

    it('should not return sites belonging to another client', async () => {
      // Register a second client
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ email: `other-${Date.now()}@example.com`, password: clientPassword });

      const otherToken = regRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/sites')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0); // No sites for new client
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/sites');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/sites/:id', () => {
    it('should return a specific site', async () => {
      const res = await request(app)
        .get(`/api/sites/${siteId1}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Test Site Alpha');
      expect(res.body.data.wpUrl).toBe('https://alpha.example.com');
    });

    it('should return 404 for non-existent site', async () => {
      const res = await request(app)
        .get('/api/sites/non-existent-id')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/sites/:id/config (internal)', () => {
    it('should return site config with correct internal header', async () => {
      const res = await request(app)
        .get(`/api/sites/${siteId1}/config`)
        .set('X-Internal-Service', 'proxy-layer');

      expect(res.status).toBe(200);
      expect(res.body.wpUrl).toBe('https://alpha.example.com');
      expect(res.body.apiToken).toBeDefined();
    });

    it('should reject without internal header', async () => {
      const res = await request(app)
        .get(`/api/sites/${siteId1}/config`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard stats with all sites', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sites).toBeDefined();
      expect(Array.isArray(res.body.data.sites)).toBe(true);

      // Both test sites should be included
      const siteIds = res.body.data.sites.map((s: { id: string }) => s.id);
      expect(siteIds).toContain(siteId1);
      expect(siteIds).toContain(siteId2);
    });

    it('should return count properties (even if 0 when proxy unavailable)', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.productCount).toBe('number');
      expect(typeof res.body.data.orderCount).toBe('number');
      expect(typeof res.body.data.postCount).toBe('number');
      expect(typeof res.body.data.recentActivity).toBe('number');
    });

    it('should return siteStats object', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.siteStats).toBe('object');
    });

    it('should accept a siteId query parameter', async () => {
      const res = await request(app)
        .get(`/api/dashboard/stats?siteId=${siteId1}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should ensure all sites have a display name', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      for (const site of res.body.data.sites) {
        expect(site.name).toBeDefined();
        expect(site.name.length).toBeGreaterThan(0);
      }
    });
  });

  describe('POST /api/sites/heartbeat', () => {
    it('should update site status on heartbeat', async () => {
      const site = await prisma.clientSite.findUnique({ where: { id: siteId1 } });

      const res = await request(app)
        .post('/api/sites/heartbeat')
        .send({
          siteId: siteId1,
          apiToken: site!.apiToken,
          wpVersion: '6.5.0',
          healthScore: 95,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ONLINE');

      // Verify lastPing was updated
      const updated = await prisma.clientSite.findUnique({ where: { id: siteId1 } });
      expect(updated!.lastPing).toBeDefined();
      expect(updated!.wpVersion).toBe('6.5.0');
    });

    it('should reject heartbeat with invalid token', async () => {
      const res = await request(app)
        .post('/api/sites/heartbeat')
        .send({
          siteId: siteId1,
          apiToken: 'invalid-token',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/sites/:id', () => {
    it('should delete a site', async () => {
      // Create a temporary site to delete
      const tempSite = await prisma.clientSite.create({
        data: {
          clientId,
          name: 'Temp Delete Site',
          wpUrl: 'https://temp.example.com',
          apiToken: 'temp-token-' + Date.now(),
          status: 'PENDING',
        },
      });

      const res = await request(app)
        .delete(`/api/sites/${tempSite.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(tempSite.id);

      // Verify site is gone
      const deleted = await prisma.clientSite.findUnique({ where: { id: tempSite.id } });
      expect(deleted).toBeNull();
    });
  });
});
