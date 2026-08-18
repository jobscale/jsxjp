import createHttpError from 'http-errors';
import { account } from './account/index.js';
import { api } from './api/index.js';
import { auth } from './auth/index.js';
import { planPulse } from './plan-pulse/index.js';
import { picts } from './picts/index.js';
import { shorten } from './shorten/index.js';
import { template } from './template/index.js';
import { user } from './user/index.js';

const { ENV } = process.env;

const logger = new Proxy(console, {
  get(target, prop) {
    return target[prop];
  },
});

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Env': ENV,
  server: 'jsx.jp',
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

const getResponseHeaders = res => {
  const extra = Object.fromEntries(res.headers.entries());
  const contentType = extra['content-type'];
  delete extra['content-type'];
  if (contentType) extra['Content-Type'] = contentType;
  return {
    ...headers,
    ...extra,
  };
};

const router = async (req, res) => {
  const { http: { method: httpMethod, path: httpPath } } = req.requestContext;
  const route = `${httpMethod} ${httpPath.replace(/^\/v[0-9]+/, '')}`;
  const { routeKey } = req.requestContext;
  logger.info({ route, routeKey });

  if (route === 'HEAD /auth/sign') {
    return auth.sign(req, res, true);
  }
  if (route === 'POST /auth/sign') {
    return auth.sign(req, res);
  }
  if (route === 'POST /auth/login') {
    return auth.login(req, res);
  }
  if (route === 'POST /auth/totp') {
    return auth.totp(req, res);
  }
  if (route === 'POST /account/password') {
    return account.password(req, res);
  }
  if (route === 'POST /api/slack') {
    return api.slack(req, res);
  }
  if (route === 'POST /api/email') {
    return api.email(req, res);
  }
  if (route === 'POST /api/webPush') {
    return api.webPush(req, res);
  }
  if (route === 'POST /api/sendmail') {
    return api.sendmail(req, res);
  }
  if (route === 'POST /api/subscription') {
    return api.subscription(req, res);
  }
  if (route === 'POST /api/getNumber') {
    return api.getNumber();
  }
  if (route === 'GET /api/public') {
    return api.public();
  }
  if (route === 'POST /api/hostname') {
    return api.hostname();
  }
  if (route === 'POST /api/speed') {
    return api.speed(req, res);
  }
  if (route === 'POST /picts/upload') {
    return picts.upload(req);
  }
  if (route === 'POST /picts/find') {
    return picts.find(req);
  }
  if (route === 'POST /picts/remove') {
    return picts.remove(req);
  }
  if (route === 'POST /picts/getData') {
    return picts.getData(req);
  }
  if (route === 'POST /picts/putData') {
    return picts.putData(req);
  }
  if (route === 'POST /plan-pulse/hub') {
    return planPulse.hub(req, res);
  }
  if (route === 'POST /plan-pulse/putHub') {
    return planPulse.putHub(req, res);
  }
  if (route === 'POST /plan-pulse/putPerson') {
    return planPulse.putPerson(req, res);
  }
  if (route === 'POST /plan-pulse/removePerson') {
    return planPulse.removePerson(req, res);
  }
  if (route === 'POST /template') {
    return template.load(req, res);
  }
  if (route.startsWith('GET /picts/')) {
    const [, type, ...parts] = route.slice('GET /picts/'.length).split('/');
    return picts.image(req, res, type, parts.join('/'));
  }
  if (route === 'GET /picts') {
    await picts.login(req);
    return { statusCode: 404, body: '404 NotFound' };
  }
  if (route === 'GET /s') {
    await shorten.verify(req);
    return 'i am shorten';
  }
  if (route.startsWith('GET /s/')) {
    return shorten.redirect(route.slice('GET /s/'.length));
  }
  if (route === 'POST /s/register') {
    return shorten.register(req);
  }
  if (route === 'POST /s/find') {
    return shorten.find(req);
  }
  if (route === 'POST /s/remove') {
    return shorten.remove(req);
  }
  if (route === 'POST /user/register') {
    return user.register(req, res);
  }
  if (route === 'POST /user/reset') {
    return user.reset(req, res);
  }
  if (route === 'POST /user/find') {
    return user.find(req, res);
  }
  if (route === 'POST /user/remove') {
    return user.remove(req, res);
  }

  throw createHttpError(405);
};

const createServer = event => {
  const requestHeaders = new Headers(event.headers || {});
  const contentType = requestHeaders.get('content-type') || '';
  const req = {
    headers: requestHeaders,
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
    headers: new Headers(),
    statusCode: 200,
    writableEnded: false,
    cookies: [],
    body: undefined,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(value) {
      res.body = value;
      res.writableEnded = true;
      return res;
    },
    end(value = '') {
      res.body = value;
      res.writableEnded = true;
      return res;
    },
    setHeader(name, value) {
      res.headers.set(name, value);
    },
  };
  res.setCookie = (name, value, options) => {
    res.cookies.push(serializeCookie(name, value, options));
  };
  return { req, res };
};

export const handler = async event => {
  logger.info('EVENT:', JSON.stringify(event, null, 2));

  const { req, res } = createServer(event);
  const result = await router(req, res)
  .catch(e => {
    logger.info({ message: e });
    if (!e.status) e.status = 500;
    res.status(e.status).json({ message: e.message });
  });
  const responseHeaders = getResponseHeaders(res);
  const contentType = responseHeaders['Content-Type'] || '';
  const isBinary = Buffer.isBuffer(result)
    || /^image\//.test(contentType)
    || contentType === 'application/octet-stream';
  const response = {
    statusCode: res.statusCode,
    headers: responseHeaders,
    cookies: res.cookies,
    body: isBinary
      ? result?.toString('base64') || ''
      : result === undefined && res.body === undefined
        ? ''
        : typeof (result === undefined ? res.body : result) === 'string'
          ? result === undefined ? res.body : result
          : JSON.stringify(result === undefined ? res.body : result, null, 2),
  };
  if (result?.redirect) {
    response.statusCode = 302;
    response.headers.Location = result.redirect;
    response.body = '';
  }
  if (isBinary) response.isBase64Encoded = true;
  return response;
};

// example
// curl -i -X POST https://dev-serverless.jsx.jp/v1/auth/login --data '{"login":"guest","password":"secret"}' -H 'Content-Type: application/json'
