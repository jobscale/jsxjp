
import { Readable } from 'stream';
import { describe, expect, jest, beforeEach } from '@jest/globals';

process.env.ENV = 'test';

const mockDb = {
  getValue: jest.fn(),
  setValue: jest.fn(),
};

const mockLogger = {
  info: jest.fn(arg => arg),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockStore = {
  getValue: jest.fn(),
  setValue: jest.fn(),
};

const mockConfigService = {
  getEnv: jest.fn(),
};

const mockAuthService = {
  decode: jest.fn(),
};

const mockSlug = {
  send: jest.fn(),
};

const mockSlack = jest.fn().mockImplementation(() => mockSlug);

const mockWebPush = {
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
};

const mockNodemailer = {
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
};

jest.unstable_mockModule('../app/db.js', () => ({
  db: mockDb,
}));

jest.unstable_mockModule('@jobscale/logger', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../app/store.js', () => ({
  store: mockStore,
}));

jest.unstable_mockModule('../app/config/service.js', () => ({
  service: mockConfigService,
}));

jest.unstable_mockModule('../app/auth/service.js', () => ({
  service: mockAuthService,
}));

jest.unstable_mockModule('@jobscale/slack', () => ({
  Slack: mockSlack,
}));

jest.unstable_mockModule('web-push', () => ({
  default: mockWebPush,
}));

jest.unstable_mockModule('nodemailer', () => ({
  default: mockNodemailer,
}));

// Mock other routes
const mockRouter = {
  router: {
    routes: [],
  },
};
jest.unstable_mockModule('../app/shorten/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/ip/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/auth/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/account/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/user/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/template/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/plan-pulse/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/picts/route.js', () => ({ route: mockRouter }));

const { app } = await import('../app/index.js');

describe('API Routing via app/index.js', () => {
  const request = (method, url, body = null, headers = {}) => new Promise((resolve) => {
    const req = new Readable();
    req.method = method;
    req.url = url;
    req.headers = { ...headers, host: 'localhost' };
    req.socket = { encrypted: false, remoteAddress: '127.0.0.1' };
    req.cookies = {};
    if (headers.cookie) {
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

  describe('POST /api/slack', () => {
    it('should send slack message', async () => {
      mockSlug.send.mockResolvedValue('ok');
      const body = { text: 'hello' };
      const res = await request('POST', '/api/slack', body);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toBe('ok');
      expect(mockSlug.send).toHaveBeenCalledWith(body);
    });

    it('should handle slack error', async () => {
      mockConfigService.getEnv.mockRejectedValueOnce(new Error('config error'));
      const body = { text: 'hello' };
      const res = await request('POST', '/api/slack', body);
      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body)).toEqual({ message: 'config error' });
    });

    it('should validate input', async () => {
      const res = await request('POST', '/api/slack', {});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/email', () => {
    it('should send email', async () => {
      mockNodemailer.createTransport().sendMail.mockResolvedValue('ok');
      const body = { subject: 'test', text: 'body' };
      const res = await request('POST', '/api/email', body);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toBe('ok');
    });

    it('should validate input', async () => {
      const res = await request('POST', '/api/email', {});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/public', () => {
    it('should return public cert', async () => {
      mockDb.getValue.mockResolvedValue({ public: 'public-cert' });
      const res = await request('GET', '/api/public');
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('public-cert');
    });

    it('should handle error', async () => {
      mockDb.getValue.mockRejectedValue(new Error('db error'));
      const res = await request('GET', '/api/public');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /api/subscription', () => {
    const subscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/e...'.padEnd(64, 'a'),
      expirationTime: null,
      keys: {
        auth: '1234567890123456',
        p256dh: 'B...'.padEnd(65, 'a'),
      },
      ts: '1234567890',
      ua: 'Mozilla/5.0',
    };

    it('should register new subscription', async () => {
      mockStore.getValue.mockResolvedValue({});
      mockStore.setValue.mockResolvedValue();
      mockDb.getValue.mockResolvedValue({ public: 'pub', key: 'priv' });
      mockAuthService.decode.mockResolvedValue({});
      mockWebPush.sendNotification.mockResolvedValue();

      const res = await request('POST', '/api/subscription', subscription);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ succeeded: true });
    });

    it('should update existing subscription', async () => {
      // const hash = 'hash'; // Mock hash calculation if needed, or rely on store call
      // Since service hashes endpoint, we need to match it or mock store behavior precisely
      // Ideally we mock store.getValue to return an object where key is hash of endpoint
      // check service.js: const hash = createHash('sha3-256').update(endpoint).digest('base64');
      // For simplicity in integration test without depending on crypto implementation details:
      // We can just rely on the branching logic.
      // IF store returns null, it goes to new.
      // To test update, we need store to return something for the hash.

      // Let's rely on standard crypto for the test to set up the mock correctly
      const { createHash } = await import('crypto');
      const hash = createHash('sha3-256').update(subscription.endpoint).digest('base64');

      const users = { [hash]: { login: 'test' } };
      mockStore.getValue.mockResolvedValue(users);
      mockAuthService.decode.mockResolvedValue({ login: 'test' });
      mockDb.getValue.mockResolvedValue({ public: 'pub', key: 'priv' });
      mockWebPush.sendNotification.mockResolvedValue();

      const res = await request('POST', '/api/subscription', subscription, { cookie: 'token=t' });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ exist: true });
    });

    it('should validate input', async () => {
      const res = await request('POST', '/api/subscription', {});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/hostname', () => {
    it('should return hostname', async () => {
      const res = await request('POST', '/api/hostname');
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('hostname');
      // ip might be undefined or string depending on network in test env
    });
  });
});
