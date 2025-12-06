
import { describe, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';

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

jest.unstable_mockModule('../app/db.js', () => ({ db: mockDb }));
jest.unstable_mockModule('@jobscale/logger', () => ({ logger: mockLogger }));
// Mock other routes
const mockRouter = {
  router: {
    routes: [],
  },
};
jest.unstable_mockModule('../app/shorten/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/ip/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/api/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/auth/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/user/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/template/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/plan-pulse/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/picts/route.js', () => ({ route: mockRouter }));

const mockAuth = {
  decode: jest.fn(),
};
jest.unstable_mockModule('../app/auth/index.js', () => ({ auth: mockAuth }));
jest.unstable_mockModule('@aws-sdk/client-s3', () => ({ S3Client: jest.fn() }));
jest.unstable_mockModule('sharp', () => ({ default: jest.fn() }));

const { app } = await import('../app/index.js');

describe('Account Routing via app/index.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /account/password', () => {
    it('should update password for authenticated user', async () => {
      const login = 'testuser';
      mockAuth.decode.mockReturnValue({ login });
      mockDb.getValue.mockResolvedValue({ login, key: 'user1' });
      mockDb.setValue.mockResolvedValue({ key: 'user1' });

      const res = await request(app)
      .post('/account/password')
      .set('Cookie', 'token=valid_token')
      .send({ password: 'newpassword' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ login: 'user1' });
      expect(mockAuth.decode).toHaveBeenCalledWith('valid_token');
      expect(mockDb.getValue).toHaveBeenCalledWith('user', login);
      expect(mockDb.setValue).toHaveBeenCalledWith('user', login, expect.objectContaining({
        hash: expect.any(String),
      }));
    });

    it('should fail if token is missing', async () => {
      const res = await request(app)
      .post('/account/password')
      .send({ password: 'newpassword' });
      expect(res.statusCode).toBe(400);
    });

    it('should fail if password is too short', async () => {
      const res = await request(app)
      .post('/account/password')
      .set('Cookie', 'token=valid_token')
      .send({ password: '123' });
      expect(res.statusCode).toBe(400);
    });

    it('should fail if user not found', async () => {
      const login = 'testuser';
      mockAuth.decode.mockReturnValue({ login });
      mockDb.getValue.mockResolvedValue(null);

      const res = await request(app)
      .post('/account/password')
      .set('Cookie', 'token=valid_token')
      .send({ password: 'newpassword' });

      expect(res.statusCode).toBe(400);
    });

    it('should fail if token is invalid (no login)', async () => {
      mockAuth.decode.mockReturnValue({});
      const res = await request(app)
      .post('/account/password')
      .set('Cookie', 'token=invalid_token')
      .send({ password: 'newpassword' });
      expect(res.statusCode).toBe(400);
    });
  });
});
