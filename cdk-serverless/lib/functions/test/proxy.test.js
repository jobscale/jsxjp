import { jest } from '@jest/globals';

const auth = {
  sign: jest.fn((req, res, head) => {
    res.headers.set('X-User', 'alice');
    res.headers.set('X-Address', '127.0.0.1');
    if (head) return res.end();
    return res.json({ login: 'alice' });
  }),
  login: jest.fn((req, res) => {
    res.setCookie('token', 'token-value');
    res.json({ token: 'token-value' });
  }),
  totp: jest.fn((req, res) => res.json({ code: '123456', list: ['123456'] })),
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

jest.unstable_mockModule('../proxy/auth/index.js', () => ({ auth }));
jest.unstable_mockModule('../proxy/account/index.js', () => ({ account }));
jest.unstable_mockModule('../proxy/api/index.js', () => ({ api }));
jest.unstable_mockModule('../proxy/plan-pulse/index.js', () => ({ planPulse }));
jest.unstable_mockModule('../proxy/picts/index.js', () => ({ picts }));
jest.unstable_mockModule('../proxy/shorten/index.js', () => ({ shorten }));
jest.unstable_mockModule('../proxy/template/index.js', () => ({ template }));
jest.unstable_mockModule('../proxy/user/index.js', () => ({ user }));

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
