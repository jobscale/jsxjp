import createHttpError from 'http-errors';
import { logger } from '@jobscale/create-logger';
import { account } from './account/index.js';
import { api } from './api/index.js';
import { auth } from './auth/index.js';
import { planPulse } from './plan-pulse/index.js';
import { picts } from './picts/index.js';
import { shorten } from './shorten/index.js';
import { template } from './template/index.js';
import { user } from './user/index.js';

const { ENV } = process.env;

const defaultHeaders = {
  'X-Env': ENV,
  Server: 'jsx.jp',
};

const serializeCookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  parts.push(`Path=${options.path || '/'}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure !== false) parts.push('Secure');
  parts.push(`SameSite=${options.sameSite || 'Strict'}`);
  return parts.join('; ');
};

const parseMultipart = (body, contentType) => {
  const boundaryValue = contentType.split('boundary=')[1];
  if (!boundaryValue) return [];
  const boundary = Buffer.from(`--${boundaryValue}`);
  const files = [];
  let current = body.indexOf(boundary) + boundary.length + 2;
  while (current < body.length) {
    const nextBoundary = body.indexOf(boundary, current);
    if (nextBoundary === -1) break;
    const part = body.slice(current, nextBoundary - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const header = part.slice(0, headerEnd).toString();
      const content = part.slice(headerEnd + 4);
      const match = header.match(/name="(.+?)"(?:; filename="(.+?)")?/);
      if (match?.[2]) {
        const type = header.match(/Content-Type: (.+)/i);
        files.push({
          fieldname: match[1],
          originalname: match[2],
          buffer: content,
          mimetype: type ? type[1].trim() : 'application/octet-stream',
        });
      }
    }
    current = nextBoundary + boundary.length + 2;
  }
  return files;
};

const router = async (req, res) => {
  const { http: { method: httpMethod, path: httpPath } } = req.requestContext;
  const rawRoute = `${httpMethod} ${httpPath}`;

  if (['OPTIONS'].includes(httpMethod)) {
    res.end();
    return;
  }
  if (['PUT', 'PATCH', 'DELETE'].includes(httpMethod)) {
    throw createHttpError(405);
  }

  if (rawRoute === 'HEAD /auth/sign') {
    await auth.sign(req, res);
    return;
  }
  if (rawRoute === 'POST /auth/sign') {
    await auth.sign(req, res);
    return;
  }
  if (rawRoute === 'POST /auth/login') {
    await auth.login(req, res);
    return;
  }
  if (rawRoute === 'POST /auth/totp') {
    await auth.totp(req, res);
    return;
  }
  if (rawRoute === 'GET /auth/logout') {
    auth.logout(req, res);
    return;
  }
  if (rawRoute === 'POST /account/password') {
    await account.password(req, res);
    return;
  }
  if (rawRoute === 'POST /api/slack') {
    await api.slack(req, res);
    return;
  }
  if (rawRoute === 'POST /api/email') {
    await api.email(req, res);
    return;
  }
  if (rawRoute === 'POST /api/webPush') {
    await api.webPush(req, res);
    return;
  }
  if (rawRoute === 'POST /api/sendmail') {
    await api.sendmail(req, res);
    return;
  }
  if (rawRoute === 'POST /api/subscription') {
    await api.subscription(req, res);
    return;
  }
  if (rawRoute === 'POST /api/getNumber') {
    await api.getNumber(req, res);
    return;
  }
  if (rawRoute === 'GET /api/public') {
    await api.public(req, res);
    return;
  }
  if (rawRoute === 'POST /api/hostname') {
    await api.hostname(req, res);
    return;
  }
  if (rawRoute === 'POST /api/speed') {
    await api.speed(req, res);
    return;
  }
  if (rawRoute === 'POST /picts/upload') {
    await picts.upload(req, res);
    return;
  }
  if (rawRoute === 'POST /picts/find') {
    await picts.find(req, res);
    return;
  }
  if (rawRoute === 'POST /picts/remove') {
    await picts.remove(req, res);
    return;
  }
  if (rawRoute === 'POST /picts/getData') {
    await picts.getData(req, res);
    return;
  }
  if (rawRoute === 'POST /picts/putData') {
    await picts.putData(req, res);
    return;
  }
  if (rawRoute === 'POST /plan-pulse/hub') {
    await planPulse.hub(req, res);
    return;
  }
  if (rawRoute === 'POST /plan-pulse/putHub') {
    await planPulse.putHub(req, res);
    return;
  }
  if (rawRoute === 'POST /plan-pulse/putPerson') {
    await planPulse.putPerson(req, res);
    return;
  }
  if (rawRoute === 'POST /plan-pulse/removePerson') {
    await planPulse.removePerson(req, res);
    return;
  }
  if (rawRoute === 'POST /template') {
    await template.load(req, res);
    return;
  }
  if (rawRoute.startsWith('GET /picts/')) {
    await picts.image(req, res);
    return;
  }
  if (rawRoute === 'GET /picts') {
    await picts.login(req);
    throw createHttpError(404, '404 NotFound');
  }
  if (rawRoute === 'GET /s') {
    await shorten.verify(req);
    res.writeHead(200, 'Content-Type', 'text/plain; charset=utf-8');
    res.end('i am shorten');
    return;
  }
  if (rawRoute.startsWith('GET /s/')) {
    await shorten.redirect(req, res);
    return;
  }
  if (rawRoute === 'POST /s/register') {
    await shorten.register(req, res);
    return;
  }
  if (rawRoute === 'POST /s/find') {
    await shorten.find(req, res);
    return;
  }
  if (rawRoute === 'POST /s/remove') {
    await shorten.remove(req, res);
    return;
  }
  if (rawRoute === 'POST /user/register') {
    await user.register(req, res);
    return;
  }
  if (rawRoute === 'POST /user/reset') {
    await user.reset(req, res);
    return;
  }
  if (rawRoute === 'POST /user/find') {
    await user.find(req, res);
    return;
  }
  if (rawRoute === 'POST /user/remove') {
    await user.remove(req, res);
    return;
  }

  if (['HEAD'].includes(httpMethod)) {
    res.end();
    return;
  }

  throw createHttpError(405);
};

const createServer = event => {
  const headers = new Headers(event.headers);
  const contentType = headers.get('Content-Type') ?? '';
  const req = {
    headers,
    requestContext: event.requestContext,
  };
  if (contentType.startsWith('application/json') && event.body) {
    req.body = JSON.parse(event.body);
  } else if (contentType.startsWith('multipart/form-data')) {
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : undefined);
    req.files = parseMultipart(bodyBuffer, contentType);
  }
  req.cookies = Object.fromEntries((event.cookies || []).map(cookie => {
    const separator = cookie.indexOf('=');
    return [cookie.slice(0, separator), decodeURIComponent(cookie.slice(separator + 1))];
  }));
  const res = {
    headers: new Headers(defaultHeaders),
    statusCode: 200,
    writableEnded: false,
    cookies: [],
    body: undefined,
    status(code) {
      res.statusCode = code;
      return res;
    },
    setHeader(name, value) {
      res.headers.set(name, value);
    },
    writeHead(code, h = {}) {
      res.statusCode = code;
      for (const [key, value] of Object.entries(h)) {
        res.headers.set(key, value);
      }
    },
    json(value) {
      const indent = ENV === 'dev' ? 2 : undefined;
      res.headers.set('Content-Type', 'application/json; charset=utf-8');
      res.body = JSON.stringify(value, null, indent);
      res.writableEnded = true;
    },
    end(value) {
      res.body = value;
      res.writableEnded = true;
    },
  };
  res.setCookie = (name, value, options) => {
    res.cookies.push(serializeCookie(name, value, options));
  };
  res.clearCookie = (name, options = {}) => {
    res.cookies.push(serializeCookie(name, '', { ...options, expires: new Date(0) }));
  };
  return { req, res };
};

const ingress = async (req, res) => {
  await router(req, res)
  .catch(e => {
    logger.info({ message: e });
    if (!e.status) e.status = 500;
    res.status(e.status).json({ message: e.message });
  });
  const isBinary = Buffer.isBuffer(res.body) ? true : undefined;
  return {
    statusCode: res.statusCode,
    headers: {
      ...Object.fromEntries(res.headers.entries()),
    },
    cookies: res.cookies,
    body: isBinary ? res.body.toString('base64') : res.body,
    isBase64Encoded: isBinary,
  };
};

export const handler = async event => {
  logger.info('EVENT', JSON.stringify(event, null, 2));
  const { req, res } = createServer(event);
  const response = await ingress(req, res);
  logger.info('RESPONSE', JSON.stringify(response, null, 2));
  return response;
};

// preflight
// curl -i -X OPTIONS https://dev-serverless.jsx.jp/ip -H "Origin: https://example.com" -H "Access-Control-Request-Method: POST"
// request
// curl -i -X POST https://dev-serverless.jsx.jp/auth/login --data '{"login":"guest","password":"secret"}' -H 'Content-Type: application/json'
