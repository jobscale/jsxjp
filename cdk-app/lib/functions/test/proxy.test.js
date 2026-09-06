import { jest, beforeEach, test, expect } from '@jest/globals';
import { Router } from '../proxy/app/router.js';

process.env.ENV = 'test';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};
jest.unstable_mockModule('@jobscale/create-logger', () => ({ logger: mockLogger }));

const auth = {
  sign: jest.fn((req, res) => {
    res.headers.set('X-User', 'alice');
    res.headers.set('X-Address', '127.0.0.1');
    if (req.method === 'HEAD') return res.end();
    return res.json({ login: 'alice' });
  }),
  login: jest.fn((req, res) => {
    res.setCookie('token', 'token-value');
    res.json({ token: 'token-value' });
  }),
  totp: jest.fn((req, res) => res.json({ code: '123456', list: ['123456'] })),
  logout: jest.fn((req, res) => {
    res.clearCookie('token');
    res.redirect('/v1/auth/');
  }),
};

const account = {
  password: jest.fn((req, res) => res.json({ login: 'alice' })),
};

const api = {
  slack: jest.fn((req, res) => res.json({ ok: true })),
  email: jest.fn((req, res) => res.json({ ok: true })),
  webPush: jest.fn((req, res) => res.json({ ok: true })),
  sendmail: jest.fn((req, res) => res.json({ ts: '2026-08-18 00:00:00' })),
  subscription: jest.fn((req, res) => res.json({ register: true })),
  getNumber: jest.fn((req, res) => res.json({ number: '1234' })),
  public: jest.fn((req, res) => res.end('public-key')),
  hostname: jest.fn((req, res) => res.json({ hostname: 'test-host' })),
  speed: jest.fn((req, res) => {
    res.headers.set('Content-Type', 'application/octet-stream');
    res.end(Buffer.from('speed'));
  }),
};

const planPulse = {
  hub: jest.fn((req, res) => res.json({ hubId: 'hub-1' })),
  putHub: jest.fn((req, res) => res.json({ hubId: 'hub-2' })),
  putPerson: jest.fn((req, res) => res.json({ personId: 'person-1' })),
  removePerson: jest.fn((req, res) => res.json({})),
};

const picts = {
  upload: jest.fn((req, res) => res.json({ ok: true })),
  find: jest.fn((req, res) => res.json({ images: ['one.png'] })),
  remove: jest.fn((req, res) => res.json({ ok: true })),
  getData: jest.fn((req, res) => res.json({ settings: { enabled: true } })),
  putData: jest.fn((req, res) => res.json({ ok: true })),
  image: jest.fn((req, res) => {
    res.headers.set('Content-Type', 'image/png');
    res.end(Buffer.from('image'));
  }),
  login: jest.fn(),
};

const shorten = {
  verify: jest.fn(),
  redirect: jest.fn((req, res) => {
    res.setHeader('Location', 'https://example.com');
    res.status(307).end('');
  }),
  register: jest.fn((req, res) => res.json({ id: 'short-1' })),
  find: jest.fn((req, res) => res.json({ rows: [] })),
  remove: jest.fn((req, res) => res.json({ rows: [] })),
};

const template = {
  load: jest.fn((req, res) => {
    res.headers.set('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>template</h1>');
  }),
};

const user = {
  register: jest.fn((req, res) => res.json({ login: 'alice' })),
  reset: jest.fn((req, res) => res.json({ login: 'alice' })),
  find: jest.fn((req, res) => res.json({ rows: [] })),
  remove: jest.fn((req, res) => res.json({ deletedAt: '2026-08-18' })),
};

const mockRouter = new Router();
mockRouter.add('HEAD', '/auth/sign', auth.sign);
mockRouter.add('POST', '/auth/sign', auth.sign);
mockRouter.add('POST', '/auth/login', auth.login);
mockRouter.add('POST', '/auth/totp', auth.totp);
mockRouter.add('GET', '/auth/logout', auth.logout);
mockRouter.add('POST', '/account/password', account.password);
mockRouter.add('POST', '/api/slack', api.slack);
mockRouter.add('POST', '/api/email', api.email);
mockRouter.add('POST', '/api/webPush', api.webPush);
mockRouter.add('POST', '/api/sendmail', api.sendmail);
mockRouter.add('POST', '/api/subscription', api.subscription);
mockRouter.add('POST', '/api/getNumber', api.getNumber);
mockRouter.add('GET', '/api/public', api.public);
mockRouter.add('POST', '/api/hostname', api.hostname);
mockRouter.add('POST', '/api/speed', api.speed);
mockRouter.add('POST', '/plan-pulse/hub', planPulse.hub);
mockRouter.add('POST', '/plan-pulse/putHub', planPulse.putHub);
mockRouter.add('POST', '/plan-pulse/putPerson', planPulse.putPerson);
mockRouter.add('POST', '/plan-pulse/removePerson', planPulse.removePerson);
mockRouter.add('POST', '/picts/upload', picts.upload);
mockRouter.add('POST', '/picts/find', picts.find);
mockRouter.add('POST', '/picts/remove', picts.remove);
mockRouter.add('POST', '/picts/getData', picts.getData);
mockRouter.add('POST', '/picts/putData', picts.putData);
mockRouter.add('GET', '/picts/:type/:fname', picts.image);
mockRouter.add('GET', '/picts', picts.login);
mockRouter.add('GET', '/s', shorten.verify);
mockRouter.add('GET', '/s/:id', shorten.redirect);
mockRouter.add('POST', '/s/register', shorten.register);
mockRouter.add('POST', '/s/find', shorten.find);
mockRouter.add('POST', '/s/remove', shorten.remove);
mockRouter.add('POST', '/template', template.load);
mockRouter.add('POST', '/user/register', user.register);
mockRouter.add('POST', '/user/reset', user.reset);
mockRouter.add('POST', '/user/find', user.find);
mockRouter.add('POST', '/user/remove', user.remove);

jest.unstable_mockModule('../proxy/app/route.js', () => ({
  route: { router: mockRouter },
  default: { route: { router: mockRouter } },
}));

const { handler } = await import('../proxy/index.js');

const event = (method, path, body, options = {}) => ({
  headers: {
    'content-type': 'application/json',
    'x-forwarded-for': '127.0.0.1',
    host: 'example.test',
    ...options.headers,
  },
  body: body === undefined ? undefined : JSON.stringify(body),
  cookies: ['token=token-value'],
  requestContext: {
    http: { method, path: `${path}`, sourceIp: '127.0.0.1' },
    routeKey: `${method} /{proxy+}`,
  },
});

const call = (method, path, body, options) => handler(event(method, path, body, options));

beforeEach(() => {
  jest.clearAllMocks();
});

test.each([
  ['HEAD', '/auth/sign', undefined, auth.sign],
  ['POST', '/auth/sign', {}, auth.sign],
  ['POST', '/auth/login', {}, auth.login],
  ['POST', '/auth/totp', {}, auth.totp],
  ['POST', '/account/password', {}, account.password],
  ['POST', '/api/slack', {}, api.slack],
  ['POST', '/api/email', {}, api.email],
  ['POST', '/api/webPush', {}, api.webPush],
  ['POST', '/api/sendmail', {}, api.sendmail],
  ['POST', '/api/subscription', {}, api.subscription],
  ['POST', '/api/getNumber', {}, api.getNumber],
  ['GET', '/api/public', undefined, api.public],
  ['POST', '/api/hostname', {}, api.hostname],
  ['POST', '/api/speed', Date.now(), api.speed],
  ['POST', '/picts/upload', {}, picts.upload],
  ['POST', '/picts/find', {}, picts.find],
  ['POST', '/picts/remove', {}, picts.remove],
  ['POST', '/picts/getData', [], picts.getData],
  ['POST', '/picts/putData', {}, picts.putData],
  ['POST', '/plan-pulse/hub', {}, planPulse.hub],
  ['POST', '/plan-pulse/putHub', {}, planPulse.putHub],
  ['POST', '/plan-pulse/putPerson', {}, planPulse.putPerson],
  ['POST', '/plan-pulse/removePerson', {}, planPulse.removePerson],
  ['POST', '/template', { id: 'auth-login' }, template.load],
  ['GET', '/picts/i/photo.png', undefined, picts.image],
  ['GET', '/picts', undefined, picts.login],
  ['GET', '/s', undefined, shorten.verify],
  ['GET', '/s/short-1', undefined, shorten.redirect],
  ['POST', '/s/register', {}, shorten.register],
  ['POST', '/s/find', {}, shorten.find],
  ['POST', '/s/remove', {}, shorten.remove],
  ['POST', '/user/register', {}, user.register],
  ['POST', '/user/reset', {}, user.reset],
  ['POST', '/user/find', {}, user.find],
  ['POST', '/user/remove', {}, user.remove],
])('%s %s is routed', async (method, path, body, routeMock) => {
  const result = await call(method, path, body);
  expect(routeMock).toHaveBeenCalled();
  expect(result.statusCode).toBeGreaterThanOrEqual(200);
});

test('returns cookies and response headers', async () => {
  const result = await call('POST', '/auth/login', {});

  expect(result.cookies).toEqual(['token=token-value; Path=/; HttpOnly; Secure; SameSite=Strict']);
  expect(result.headers['content-type']).toBe('application/json; charset=utf-8');
  expect(result.body).toContain('token-value');
});

test('returns HTML without JSON encoding', async () => {
  const result = await call('POST', '/template', { id: 'auth-login' });

  expect(result.headers['content-type']).toBe('text/html; charset=utf-8');
  expect(result.body).toBe('<h1>template</h1>');
  expect(result.isBase64Encoded).toBeUndefined();
});

test('returns binary data as base64', async () => {
  const result = await call('GET', '/picts/i/photo.png');

  expect(result.headers['content-type']).toBe('image/png');
  expect(result.body).toBe(Buffer.from('image').toString('base64'));
  expect(result.isBase64Encoded).toBe(true);
});

test('returns redirect response', async () => {
  const result = await call('GET', '/s/short-1');

  expect(result.statusCode).toBe(307);
  expect(result.headers.location).toBe('https://example.com');
  expect(result.body).toBe('');
});

test('returns 405 for an unsupported route', async () => {
  const result = await call('DELETE', '/unknown');

  expect(result.statusCode).toBe(405);
  expect(JSON.parse(result.body)).toEqual({ message: 'Method Not Allowed' });
});
