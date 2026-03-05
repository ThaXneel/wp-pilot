import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';

let accessToken: string;
let refreshToken: string;
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'TestPassword123!';

describe('Auth Module', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: testPassword });

      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@test.com', password: '123' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPassword' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: testPassword });

      expect(res.status).toBe(401);
    });

    it('should return rememberMe=false by default', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.data.rememberMe).toBe(false);
    });

    it('should return rememberMe=true when requested', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword, rememberMe: true });

      expect(res.status).toBe(200);
      expect(res.body.data.rememberMe).toBe(true);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });

    it('should preserve rememberMe=true through refresh cycle', async () => {
      // Login with rememberMe=true
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword, rememberMe: true });

      expect(loginRes.status).toBe(200);
      const rememberedRefreshToken = loginRes.body.data.refreshToken;

      // Decode the refresh token to verify rememberMe is stored
      const decoded = jwt.decode(rememberedRefreshToken) as { rememberMe?: boolean; exp?: number };
      expect(decoded.rememberMe).toBe(true);

      // Refresh should preserve rememberMe
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: rememberedRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.rememberMe).toBe(true);

      // The new refresh token should ALSO have rememberMe=true
      const newDecoded = jwt.decode(refreshRes.body.data.refreshToken) as { rememberMe?: boolean; exp?: number };
      expect(newDecoded.rememberMe).toBe(true);

      // Verify expiry is ~30 days (within a minute tolerance)
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiresIn = (newDecoded.exp ?? 0) - nowSeconds;
      expect(expiresIn).toBeGreaterThan(thirtyDaysInSeconds - 60);
      expect(expiresIn).toBeLessThanOrEqual(thirtyDaysInSeconds + 60);
    });

    it('should preserve rememberMe=false through refresh cycle', async () => {
      // Login without rememberMe
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      const regularRefreshToken = loginRes.body.data.refreshToken;

      // Verify the token has 7d expiry
      const decoded = jwt.decode(regularRefreshToken) as { rememberMe?: boolean; exp?: number };
      expect(decoded.rememberMe).toBe(false);

      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiresIn = (decoded.exp ?? 0) - nowSeconds;
      expect(expiresIn).toBeGreaterThan(sevenDaysInSeconds - 60);
      expect(expiresIn).toBeLessThanOrEqual(sevenDaysInSeconds + 60);

      // Refresh should keep 7d
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: regularRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.rememberMe).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should accept reset request for existing email', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: testEmail });

      // Should succeed even if email service not configured in test
      expect(res.status).toBe(200);
    });
  });
});
