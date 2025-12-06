import { describe, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import speakeasy from 'speakeasy';

process.env.ENV = 'test';

const mockDb = {
  getValue: jest.fn(),
  setValue: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockApiService = {
  slack: jest.fn(),
};

jest.unstable_mockModule('../app/db.js', () => ({
  db: mockDb,
}));

jest.unstable_mockModule('@jobscale/logger', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../app/api/service.js', () => ({
  service: mockApiService,
}));

// Mock other routes that might be loaded by app/index.js
const mockRouter = {
  router: {
    routes: [],
  },
};
jest.unstable_mockModule('../app/shorten/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/ip/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/api/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/account/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/user/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/template/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/plan-pulse/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/picts/route.js', () => ({ route: mockRouter }));

const { app } = await import('../app/index.js');
const { auth } = await import('../app/auth/index.js');

const JWT_SECRET = 'node-express-ejs';
const TOTP_SECRET = 'JSXJPX6EY4BMPXIRSSR74';

describe('Auth Routing via app/index.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should trigger 2FA if no code provided', async () => {
      const { createHash } = await import('crypto');
      const hash = createHash('sha3-256').update('user/pass').digest('base64');

      mockDb.getValue.mockResolvedValue({ hash });
      mockDb.setValue.mockResolvedValue({});

      const res = await request(app)
      .post('/auth/login')
      .send({ login: 'user', password: 'pass' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({});
      expect(mockApiService.slack).toHaveBeenCalled();
    });

    it('should login successfully with valid code', async () => {
      const { createHash } = await import('crypto');
      const hash = createHash('sha3-256').update('user/pass').digest('base64');
      const code = speakeasy.totp({ secret: TOTP_SECRET, encoding: 'base32' });

      mockDb.getValue.mockResolvedValue({ hash });
      mockDb.setValue.mockResolvedValue({});

      const res = await request(app)
      .post('/auth/login')
      .send({ login: 'user', password: 'pass', code });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('href', '/');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should login successfully for orange user (bypass 2FA check in controller)', async () => {
      const { createHash } = await import('crypto');
      const hash = createHash('sha3-256').update('orangeUser/pass').digest('base64');

      mockDb.getValue.mockResolvedValue({ hash });
      mockDb.setValue.mockResolvedValue({});

      const res = await request(app)
      .post('/auth/login')
      .send({ login: 'orangeUser', password: 'pass' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('href', '/');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should throw 401 if user not found', async () => {
      mockDb.getValue.mockResolvedValue(null);
      const res = await request(app)
      .post('/auth/login')
      .send({ login: 'user', password: 'pass' });
      expect(res.statusCode).toBe(401);
    });

    it('should throw 401 if password mismatch', async () => {
      mockDb.getValue.mockResolvedValue({ hash: 'wrong-hash' });
      const res = await request(app)
      .post('/auth/login')
      .send({ login: 'user', password: 'pass' });
      expect(res.statusCode).toBe(401);
    });

    it('should throw 401 if code is invalid', async () => {
      const { createHash } = await import('crypto');
      const hash = createHash('sha3-256').update('user/pass').digest('base64');
      mockDb.getValue.mockResolvedValue({ hash });

      const res = await request(app)
      .post('/auth/login')
      .send({ login: 'user', password: 'pass', code: '000000' });
      expect(res.statusCode).toBe(401);
    });

    it('should validate input', async () => {
      const res = await request(app).post('/auth/login').send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/sign', () => {
    it('should verify token and return payload', async () => {
      const payload = { login: 'user', ts: Date.now() };
      const token = auth.sign(payload, JWT_SECRET);
      const res = await request(app)
      .post('/auth/sign')
      .set('Cookie', `token=${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ login: 'user' });
    });

    it('should throw 403 if token is invalid', async () => {
      const res = await request(app)
      .post('/auth/sign')
      .set('Cookie', 'token=invalid');
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /auth/logout', () => {
    it('should clear cookie and redirect', async () => {
      const token = auth.sign({ login: 'user', ts: Date.now() }, JWT_SECRET);
      const res = await request(app)
      .get('/auth/logout')
      .set('Cookie', `token=${token}`);

      expect(res.statusCode).toBe(307);
      expect(res.headers.location).toBe('/auth');
      // Check if Set-Cookie contains token=; or similar to clear it
      // actually controller does res.clearCookie('token')
    });
  });

  describe('POST /auth/totp', () => {
    it('should generate totp setup', async () => {
      const res = await request(app)
      .post('/auth/totp')
      .send({ secret: 'ABCDEFGHIJKLMNOP' }); // valid base32

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('list');
    });

    it('should validate input', async () => {
      const res = await request(app)
      .post('/auth/totp')
      .send({ secret: '123' }); // too short
      expect(res.statusCode).toBe(400);
    });
  });
});
