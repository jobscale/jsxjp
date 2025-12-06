import { Readable } from 'stream';
import { describe, expect, jest, beforeEach } from '@jest/globals';

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

jest.unstable_mockModule('../app/db.js', () => ({
  db: mockDb,
}));

jest.unstable_mockModule('@jobscale/logger', () => ({
  logger: mockLogger,
}));

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
jest.unstable_mockModule('../app/auth/service.js', () => ({
  service: mockAuthService,
}));

// Mock other dependencies to avoid side effects
jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
}));

jest.unstable_mockModule('sharp', () => ({
  default: jest.fn(),
}));

const { app } = await import('../app/index.js');

describe('User Routing via app/index.js', () => {
  const request = (method, url, body = null, headers = {}) => new Promise((resolve) => {
    const req = new Readable();
    req.method = method;
    req.url = url;
    req.headers = { ...headers, host: 'localhost' };
    req.socket = { encrypted: false, remoteAddress: '127.0.0.1' };

    if (body) {
      if (typeof body === 'object') {
        req.push(JSON.stringify(body));
        req.headers['content-type'] = 'application/json';
      } else {
        req.push(body);
      }
    }
    req.push(null);

    const res = {
      statusCode: 200,
      headers: {},
      body: [],
      setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      getHeader(name) {
        return this.headers[name.toLowerCase()];
      },
      getHeaders() {
        return this.headers;
      },
      writeHead(statusCode, h) {
        this.statusCode = statusCode;
        if (h) {
          for (const [key, value] of Object.entries(h)) {
            this.headers[key.toLowerCase()] = value;
          }
        }
      },
      end(chunk) {
        if (chunk) this.body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        if (this.onFinish) this.onFinish();
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: Buffer.concat(this.body).toString(),
        });
      },
      write(chunk) {
        this.body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      },
      on(event, cb) {
        if (event === 'finish') this.onFinish = cb;
      },
      once(event, cb) {
        if (event === 'finish') this.onFinish = cb;
      },
      emit(event) {
        if (event === 'finish' && this.onFinish) this.onFinish();
      },
      writableEnded: false,
    };

    // Hook into end to set writableEnded (like picts.test.js)
    const originalEnd = res.end;
    res.end = function (...args) {
      this.writableEnded = true;
      originalEnd.apply(this, args);
    };

    app(req, res);
  });

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

      const res = await request('POST', '/user/find');

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.rows).toHaveLength(2);
      expect(data.rows[0].id).toBe('user1');
      expect(mockDb.list).toHaveBeenCalledWith('user');
    });
  });

  describe('POST /user/register', () => {
    it('should register a new user', async () => {
      mockDb.getValue.mockResolvedValue(null);
      mockDb.setValue.mockResolvedValue({});

      const res = await request('POST', '/user/register', { login: 'testuser', password: 'password' });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ login: 'testuser' });
      expect(mockDb.getValue).toHaveBeenCalledWith('user', 'testuser');
      expect(mockDb.setValue).toHaveBeenCalledWith('user', 'testuser', expect.objectContaining({
        deletedAt: 0,
        hash: expect.any(String),
      }));
    });

    it('should fail if user already exists', async () => {
      mockDb.getValue.mockResolvedValue({ login: 'testuser' });

      const res = await request('POST', '/user/register', { login: 'testuser', password: 'password' });

      expect(res.statusCode).toBe(400);
    });

    it('should fail if missing login or password', async () => {
      const res = await request('POST', '/user/register', { login: 'testuser' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /user/reset', () => {
    it('should reset password for existing user', async () => {
      const existingUser = { key: 'user1', login: 'testuser', some: 'data' };
      mockDb.getValue.mockResolvedValue(existingUser);
      mockDb.setValue.mockResolvedValue({});

      const res = await request('POST', '/user/reset', { login: 'testuser', password: 'newpassword' });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ login: 'testuser' });
      expect(mockDb.setValue).toHaveBeenCalledWith('user', 'testuser', expect.objectContaining({
        ...existingUser,
        hash: expect.any(String),
        deletedAt: 0,
      }), 'user1');
    });

    it('should fail if user does not exist', async () => {
      mockDb.getValue.mockResolvedValue(null);

      const res = await request('POST', '/user/reset', { login: 'testuser', password: 'password' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /user/remove', () => {
    it('should logically remove user', async () => {
      const existingUser = { key: 'user1', login: 'testuser' };
      mockDb.getValue.mockResolvedValue(existingUser);
      mockDb.setValue.mockResolvedValue({ deletedAt: '2023-01-01' });

      const res = await request('POST', '/user/remove', { id: 'user1' });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ deletedAt: expect.any(String) });
      expect(mockDb.setValue).toHaveBeenCalledWith('user', 'user1', expect.objectContaining({
        deletedAt: expect.any(String),
      }));
    });

    it('should physically delete if already logically removed', async () => {
      const existingUser = { key: 'user1', login: 'testuser', deletedAt: 'some-date' };
      mockDb.getValue.mockResolvedValue(existingUser);
      mockDb.deleteValue.mockResolvedValue({});

      const res = await request('POST', '/user/remove', { id: 'user1' });

      expect(res.statusCode).toBe(200);
      expect(mockDb.deleteValue).toHaveBeenCalledWith('user', 'user1');
    });
  });
});
