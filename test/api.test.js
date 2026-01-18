
import { describe, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';

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

jest.unstable_mockModule('../app/db.js', () => ({ db: mockDb }));
jest.unstable_mockModule('@jobscale/logger', () => ({ logger: mockLogger }));
jest.unstable_mockModule('../app/store.js', () => ({ store: mockStore }));
jest.unstable_mockModule('../app/config/service.js', () => ({ service: mockConfigService }));
jest.unstable_mockModule('../app/auth/service.js', () => ({ service: mockAuthService }));
jest.unstable_mockModule('@jobscale/slack', () => ({ Slack: mockSlack }));
jest.unstable_mockModule('web-push', () => ({ default: mockWebPush }));
jest.unstable_mockModule('nodemailer', () => ({ default: mockNodemailer }));

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/getNumber', () => {
    it('should return encrypted image object', async () => {
      const body = '';
      const res = await request(app).post('/api/getNumber').send(body);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        image: expect.stringMatching(/^data:image\/png;base64,/),
        secret: {
          iv: expect.stringMatching(/^[0-9a-fA-F]+$/),
          data: expect.stringMatching(/^[0-9a-fA-F]+$/),
          tag: expect.stringMatching(/^[0-9a-fA-F]+$/),
        },
      });
    });

    it('should get random number', async () => {
      const body = '';
      const res = await request(app).post('/api/getNumber').send(body);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        image: expect.stringMatching(/^data:image\/png;base64,/),
        secret: {
          iv: expect.stringMatching(/^[0-9a-fA-F]+$/),
          data: expect.stringMatching(/^[0-9a-fA-F]+$/),
          tag: expect.stringMatching(/^[0-9a-fA-F]+$/),
        },
      });
      const style = '<style>:root { color-scheme: light dark; }</style>';
      const script = '<script>setTimeout(window.close, 3000)</script>';
      const html = `${style}<img src="${res.body.image}">${script}`;
      const fs = await import('fs');
      const fname = `/tmp/${Date.now()}.html`;
      fs.writeFileSync(fname, html);
      const { spawn } = await import('child_process');
      spawn('google-chrome', ['--new-window', `--app=file://${fname}`], { detached: true });
    });
  });

  describe('POST /api/slack', () => {
    it('should send slack message', async () => {
      mockSlug.send.mockResolvedValue('ok');
      const body = { text: 'hello' };
      const res = await request(app).post('/api/slack').send(body);
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('ok');
      expect(mockSlug.send).toHaveBeenCalledWith(body);
    });

    it('should handle slack error', async () => {
      mockConfigService.getEnv.mockRejectedValueOnce(new Error('config error'));
      const body = { text: 'hello' };
      const res = await request(app).post('/api/slack').send(body);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: 'config error' });
    });

    it('should validate input', async () => {
      const res = await request(app).post('/api/slack').send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/email', () => {
    it('should send email', async () => {
      mockConfigService.getEnv.mockResolvedValue({ auth: {}, from: 'test@example.com' });
      mockNodemailer.createTransport().sendMail.mockResolvedValue('ok');
      const body = { subject: 'test', text: 'body' };
      const res = await request(app).post('/api/email').send(body);
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('ok');
    });

    it('should validate input', async () => {
      const res = await request(app).post('/api/email').send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/public', () => {
    it('should return public cert', async () => {
      mockDb.getValue.mockResolvedValue({ public: 'public-cert' });
      const res = await request(app).get('/api/public');
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe('public-cert');
    });

    it('should handle error', async () => {
      mockDb.getValue.mockRejectedValue(new Error('db error'));
      const res = await request(app).get('/api/public');
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

      const res = await request(app).post('/api/subscription').send(subscription);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ register: true });
    });

    it('should update existing subscription', async () => {
      // Let's rely on standard crypto for the test to set up the mock correctly
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha3-256').update(subscription.endpoint).digest('base64');

      const users = { [hash]: { login: 'test' } };
      mockStore.getValue.mockResolvedValue(users);
      mockAuthService.decode.mockResolvedValue({ login: 'test' });
      mockDb.getValue.mockResolvedValue({ public: 'pub', key: 'priv' });
      mockWebPush.sendNotification.mockResolvedValue();

      const res = await request(app)
      .post('/api/subscription')
      .set('Cookie', 'token=t')
      .send(subscription);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ exist: true });
    });

    it('should validate input', async () => {
      const res = await request(app).post('/api/subscription').send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/hostname', () => {
    it('should return hostname', async () => {
      const res = await request(app).post('/api/hostname');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('hostname');
      // ip might be undefined or string depending on network in test env
    });
  });
});
