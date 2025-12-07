
import { describe, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';

process.env.ENV = 'test';

const mockDb = {
  getValue: jest.fn(),
  setValue: jest.fn((table, key) => Promise.resolve({ key })),
  deleteValue: jest.fn(),
  list: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockAuthService = {
  decode: jest.fn(),
};

const mockAuthController = {
  verify: jest.fn((req, res, next) => next(req, res)),
};

jest.unstable_mockModule('../app/db.js', () => ({ db: mockDb }));
jest.unstable_mockModule('@jobscale/logger', () => ({ logger: mockLogger }));
const mockJSDOMInstance = {
  window: {
    document: {
      querySelector: jest.fn(() => ({ textContent: 'Mock Title' })),
    },
  },
};
const MockJSDOM = jest.fn(() => mockJSDOMInstance);
jest.unstable_mockModule('jsdom', () => ({ JSDOM: MockJSDOM }));
jest.unstable_mockModule('../app/auth/service.js', () => ({ service: mockAuthService }));
jest.unstable_mockModule('../app/auth/controller.js', () => ({ controller: mockAuthController }));

// Mock other routes to avoid loading them and their dependencies
const mockRouter = {
  router: {
    routes: [],
    use: jest.fn(),
    add: jest.fn(),
  },
};
jest.unstable_mockModule('../app/ip/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/api/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/account/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/user/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/template/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/plan-pulse/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/picts/route.js', () => ({ route: mockRouter }));

const { app } = await import('../app/index.js');

describe('Shorten Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() => Promise.resolve({
      text: () => Promise.resolve('<title>Example Domain</title>'),
    }));
  });

  describe('GET /s/:id', () => {
    it('should redirect to original URL', async () => {
      mockDb.getValue.mockResolvedValue({ html: 'http://example.com' });
      mockDb.setValue.mockResolvedValue();

      const res = await request(app).get('/s/test-id');
      expect(res.statusCode).toBe(307);
      expect(res.headers.location).toBe('http://example.com');
      expect(mockDb.getValue).toHaveBeenCalledWith('shorten', 'test-id');
    });

    it('should handle missing ID', async () => {
      mockDb.getValue.mockResolvedValue(null);

      const res = await request(app).get('/s/missing-id');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Bad Request');
    });

    it('should handle deleted URL', async () => {
      mockDb.getValue.mockResolvedValue({ deletedAt: 1234567890 });

      const res = await request(app).get('/s/deleted-id');
      expect(res.statusCode).toBe(501);
      expect(res.body.message).toBe('Not Implemented');
    });

    it('should handle DB error', async () => {
      mockDb.getValue.mockRejectedValue(new Error('DB Error'));

      const res = await request(app).get('/s/error-id');
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('DB Error');
    });
  });

  describe('POST /s/register', () => {
    it('should register new URL', async () => {
      mockDb.getValue.mockResolvedValue(null); // No existing hash
      mockDb.setValue.mockImplementation((table, key) => Promise.resolve({ key }));

      const res = await request(app)
      .post('/s/register')
      .send({ html: 'http://example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(mockDb.setValue).toHaveBeenCalledTimes(2); // Hash and Data
    });

    it('should return existing key if hash exists', async () => {
      mockDb.getValue
      .mockResolvedValueOnce({ code: 'existing-key' }) // Hash exists
      .mockResolvedValueOnce({ caption: 'Example' }); // Get existing data

      const res = await request(app)
      .post('/s/register')
      .send({ html: 'http://example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: 'existing-key' });
    });

    it('should validation error if html is missing', async () => {
      const res = await request(app)
      .post('/s/register')
      .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Bad Request');
    });
  });

  describe('POST /s/find', () => {
    it('should return list for authorized user', async () => {
      mockAuthService.decode.mockResolvedValue({ login: 'alice' });
      const mockItems = [
        { key: 'id1', html: 'url1', registerAt: 0, lastAccess: 0, deletedAt: 0 },
      ];
      mockDb.list.mockResolvedValue(mockItems);

      const res = await request(app)
      .post('/s/find')
      .set('Cookie', 'token=valid-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.rows).toHaveLength(1);
      expect(res.body.rows[0].id).toBe('id1');
    });

    it('should return 403 for unauthorized user', async () => {
      mockAuthService.decode.mockResolvedValue({ login: 'bob' });

      const res = await request(app)
      .post('/s/find')
      .set('Cookie', 'token=valid-token');

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /s/remove', () => {
    it('should soft delete URL', async () => {
      mockDb.getValue.mockResolvedValue({ html: 'url' });
      mockDb.setValue.mockResolvedValue();

      const res = await request(app)
      .post('/s/remove')
      .send({ id: 'test-id' });

      expect(res.statusCode).toBe(200);
      expect(mockDb.setValue).toHaveBeenCalledWith('shorten', 'test-id', expect.objectContaining({
        deletedAt: expect.any(Number),
      }));
    });

    it('should delete if already soft deleted', async () => {
      mockDb.getValue.mockResolvedValue({ html: 'url', deletedAt: 123 });
      mockDb.deleteValue.mockResolvedValue();

      const res = await request(app)
      .post('/s/remove')
      .send({ id: 'test-id' });

      expect(res.statusCode).toBe(200);
      expect(mockDb.deleteValue).toHaveBeenCalledWith('shorten', 'test-id');
    });

    it('should handle missing ID', async () => {
      const res = await request(app)
      .post('/s/remove')
      .send({});

      expect(res.statusCode).toBe(400); // 500 because undefined key throws in service.remove before check? No, service checks key
    });
  });
});
