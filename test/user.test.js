
import { describe, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';

process.env.ENV = 'test';

const mockDb = {
  list: jest.fn(),
  getValue: jest.fn(),
  setValue: jest.fn(),
  deleteValue: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule('../app/db.js', () => ({ db: mockDb }));
jest.unstable_mockModule('@jobscale/logger', () => ({ logger: mockLogger }));
// Mock shorten route to avoid pulling in jsdom via shorten/service.js
const mockRouter = {
  router: {
    routes: [],
  },
};
jest.unstable_mockModule('../app/shorten/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/ip/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/api/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/auth/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/account/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/template/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/plan-pulse/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/picts/route.js', () => ({ route: mockRouter }));

const mockAuthService = {
  decode: jest.fn().mockResolvedValue({ login: 'alice' }),
};
jest.unstable_mockModule('../app/auth/service.js', () => ({ service: mockAuthService }));
// Mock other dependencies to avoid side effects
jest.unstable_mockModule('@aws-sdk/client-s3', () => ({ S3Client: jest.fn() }));
jest.unstable_mockModule('sharp', () => ({ default: jest.fn() }));

const { app } = await import('../app/index.js');

describe('User Routing via app/index.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /user/find', () => {
    it('should return list of users', async () => {
      const users = [
        { key: 'user1', login: 'user1', registerAt: Date.now() },
        { key: 'user2', login: 'user2' },
      ];
      mockDb.list.mockResolvedValue(users);

      const res = await request(app).post('/user/find');

      expect(res.statusCode).toBe(200);
      const data = res.body;
      expect(data.rows).toHaveLength(2);
      expect(data.rows[0].id).toBe('user1');
      expect(mockDb.list).toHaveBeenCalledWith('user');
    });
  });

  describe('POST /user/register', () => {
    it('should register a new user', async () => {
      mockDb.getValue.mockResolvedValue(null);
      mockDb.setValue.mockResolvedValue({});

      const res = await request(app)
      .post('/user/register')
      .send({ login: 'testuser', password: 'password', role: 'guest' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ login: 'testuser' });
      expect(mockDb.getValue).toHaveBeenCalledWith('user', 'testuser');
      expect(mockDb.setValue).toHaveBeenCalledWith('user', 'testuser', expect.objectContaining({
        deletedAt: 0,
        hash: expect.any(String),
      }));
    });

    it('should fail if user already exists', async () => {
      mockDb.getValue.mockResolvedValue({ login: 'testuser' });

      const res = await request(app)
      .post('/user/register')
      .send({ login: 'testuser', password: 'password' });

      expect(res.statusCode).toBe(400);
    });

    it('should fail if missing login or password', async () => {
      const res = await request(app)
      .post('/user/register')
      .send({ login: 'testuser' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /user/reset', () => {
    it('should reset password for existing user', async () => {
      const existingUser = { key: 'user1', login: 'testuser', some: 'data' };
      mockDb.getValue.mockResolvedValue(existingUser);
      mockDb.setValue.mockResolvedValue({});

      const res = await request(app)
      .post('/user/reset')
      .send({ login: 'testuser', password: 'newpassword', role: 'staff' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ login: 'testuser' });
      expect(mockDb.setValue).toHaveBeenCalledWith('user', 'testuser', expect.objectContaining({
        ...existingUser,
        hash: expect.any(String),
        deletedAt: 0,
      }), 'user1');
    });

    it('should fail if user does not exist', async () => {
      mockDb.getValue.mockResolvedValue(null);

      const res = await request(app)
      .post('/user/reset')
      .send({ login: 'testuser', password: 'password' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /user/remove', () => {
    it('should logically remove user', async () => {
      const existingUser = { key: 'user1', login: 'testuser' };
      mockDb.getValue.mockResolvedValue(existingUser);
      mockDb.setValue.mockResolvedValue({ deletedAt: '2023-01-01' });

      const res = await request(app)
      .post('/user/remove')
      .send({ id: 'user1' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ deletedAt: expect.any(String) });
      expect(mockDb.setValue).toHaveBeenCalledWith('user', 'user1', expect.objectContaining({
        deletedAt: expect.any(String),
      }));
    });

    it('should physically delete if already logically removed', async () => {
      const existingUser = { key: 'user1', login: 'testuser', deletedAt: 'some-date' };
      mockDb.getValue.mockResolvedValue(existingUser);
      mockDb.deleteValue.mockResolvedValue({});

      const res = await request(app)
      .post('/user/remove')
      .send({ id: 'user1' });

      expect(res.statusCode).toBe(200);
      expect(mockDb.deleteValue).toHaveBeenCalledWith('user', 'user1');
    });
  });
});
