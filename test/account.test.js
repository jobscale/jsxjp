
import { Readable } from 'stream';
import { describe, expect, jest, beforeEach } from '@jest/globals';

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

jest.unstable_mockModule('../app/db.js', () => ({
  db: mockDb,
}));

jest.unstable_mockModule('@jobscale/logger', () => ({
  logger: mockLogger,
}));

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
jest.unstable_mockModule('../app/auth/index.js', () => ({
  auth: mockAuth,
}));

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
}));

jest.unstable_mockModule('sharp', () => ({
  default: jest.fn(),
}));

const { app } = await import('../app/index.js');

describe('Account Routing via app/index.js', () => {
  const request = (method, url, body = null, headers = {}) => new Promise((resolve) => {
    const req = new Readable();
    req.method = method;
    req.url = url;
    req.headers = { ...headers, host: 'localhost' };
    req.socket = { encrypted: false, remoteAddress: '127.0.0.1' };
    req.cookies = {};
    if (headers.cookie) {
      // Simple cookie parser for mock
      headers.cookie.split(';').forEach(c => {
        const [k, v] = c.trim().split('=');
        req.cookies[k] = v;
      });
    }

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

  describe('POST /account/password', () => {
    it('should update password for authenticated user', async () => {
      const login = 'testuser';
      mockAuth.decode.mockReturnValue({ login });
      mockDb.getValue.mockResolvedValue({ login, key: 'user1' });
      mockDb.setValue.mockResolvedValue({ key: 'user1' });

      const res = await request('POST', '/account/password', { password: 'newpassword' }, { cookie: 'token=valid_token' });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ login: 'user1' });
      expect(mockAuth.decode).toHaveBeenCalledWith('valid_token');
      expect(mockDb.getValue).toHaveBeenCalledWith('user', login);
      expect(mockDb.setValue).toHaveBeenCalledWith('user', login, expect.objectContaining({
        hash: expect.any(String),
      }));
    });

    it('should fail if token is missing', async () => {
      const res = await request('POST', '/account/password', { password: 'newpassword' });
      expect(res.statusCode).toBe(400);
    });

    it('should fail if password is too short', async () => {
      const res = await request('POST', '/account/password', { password: '123' }, { cookie: 'token=valid_token' });
      expect(res.statusCode).toBe(400);
    });

    it('should fail if user not found', async () => {
      const login = 'testuser';
      mockAuth.decode.mockReturnValue({ login });
      mockDb.getValue.mockResolvedValue(null);

      const res = await request('POST', '/account/password', { password: 'newpassword' }, { cookie: 'token=valid_token' });

      expect(res.statusCode).toBe(400);
    });

    it('should fail if token is invalid (no login)', async () => {
      mockAuth.decode.mockReturnValue({});
      const res = await request('POST', '/account/password', { password: 'newpassword' }, { cookie: 'token=invalid_token' });
      expect(res.statusCode).toBe(400);
    });
  });
});
