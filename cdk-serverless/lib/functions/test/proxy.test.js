import { jest } from '@jest/globals';

const auth = {
  sign: jest.fn((req, res, head) => {
    res.headers.set('X-User', 'alice');
    res.headers.set('X-Address', '127.0.0.1');
    return head ? undefined : { login: 'alice' };
  }),
  login: jest.fn((req, res) => {
    res.setCookie('token', 'token-value');
    return { token: 'token-value' };
  }),
  totp: jest.fn(() => ({ code: '123456', list: ['123456'] })),
};

const account = {
  password: jest.fn(() => ({ login: 'alice' })),
};

const api = {
  slack: jest.fn(() => ({ ok: true })),
  email: jest.fn(() => ({ ok: true })),
  webPush: jest.fn(() => ({ ok: true })),
  sendmail: jest.fn(() => ({ ts: '2026-08-18 00:00:00' })),
  subscription: jest.fn(() => ({ register: true })),
  getNumber: jest.fn(() => ({ number: '1234' })),
  public: jest.fn(() => 'public-key'),
  hostname: jest.fn(() => ({ hostname: 'test-host' })),
  speed: jest.fn((req, res) => {
    res.headers.set('Content-Type', 'application/octet-stream');
    return Buffer.from('speed');
  }),
};

const planPulse = {
  hub: jest.fn(() => ({ hubId: 'hub-1' })),
  putHub: jest.fn(() => ({ hubId: 'hub-2' })),
  putPerson: jest.fn(() => ({ personId: 'person-1' })),
  removePerson: jest.fn(() => ({})),
};

const picts = {
  upload: jest.fn(() => ({ ok: true })),
  find: jest.fn(() => ({ images: ['one.png'] })),
  remove: jest.fn(() => ({ ok: true })),
  getData: jest.fn(() => ({ settings: { enabled: true } })),
  putData: jest.fn(() => ({ ok: true })),
  image: jest.fn((req, res) => {
    res.headers.set('Content-Type', 'image/png');
    return Buffer.from('image');
  }),
  login: jest.fn(),
};

const shorten = {
  verify: jest.fn(),
  redirect: jest.fn(() => ({ redirect: 'https://example.com' })),
  register: jest.fn(() => ({ id: 'short-1' })),
  find: jest.fn(() => ({ rows: [] })),
  remove: jest.fn(() => ({ rows: [] })),
};

const template = {
  load: jest.fn((req, res) => {
    res.headers.set('Content-Type', 'text/html; charset=utf-8');
    return '<h1>template</h1>';
  }),
};

const user = {
  register: jest.fn(() => ({ login: 'alice' })),
  reset: jest.fn(() => ({ login: 'alice' })),
  find: jest.fn(() => ({ rows: [] })),
  remove: jest.fn(() => ({ deletedAt: '2026-08-18' })),
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
    http: { httpMethod: method, httpPath: `/v1${path}`, sourceIp: '127.0.0.1' },
    routeKey: `${method} /v1/{proxy+}`,
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
  expect(result.headers['Content-Type']).toBe('application/json; charset=utf-8');
  expect(result.body).toContain('token-value');
});

test('returns HTML without JSON encoding', async () => {
  const result = await call('POST', '/template', { id: 'auth-login' });

  expect(result.headers['Content-Type']).toBe('text/html; charset=utf-8');
  expect(result.body).toBe('<h1>template</h1>');
  expect(result.isBase64Encoded).toBeUndefined();
});

test('returns binary data as base64', async () => {
  const result = await call('GET', '/picts/i/photo.png');

  expect(result.headers['Content-Type']).toBe('image/png');
  expect(result.body).toBe(Buffer.from('image').toString('base64'));
  expect(result.isBase64Encoded).toBe(true);
});

test('returns redirect response', async () => {
  const result = await call('GET', '/s/short-1');

  expect(result.statusCode).toBe(302);
  expect(result.headers.Location).toBe('https://example.com');
  expect(result.body).toBe('');
});

test('returns 405 for an unsupported route', async () => {
  const result = await call('DELETE', '/unknown');

  expect(result.statusCode).toBe(405);
  expect(JSON.parse(result.body)).toEqual({ message: 'Method Not Allowed' });
});
