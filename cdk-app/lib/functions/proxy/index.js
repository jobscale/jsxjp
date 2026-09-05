import { EventEmitter } from 'events';
import { logger } from '@jobscale/create-logger';
import { Ingress } from './app/index.js';

const { ENV } = process.env;

const defaultHeaders = {
  'X-Env': ENV,
  Server: 'jsx.jp',
};

const serializeCookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
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

const createServer = event => {
  const { http: request } = event.requestContext;

  const req = { headers: new Headers(event.headers) };
  const contentType = req.headers.get('Content-Type') ?? '';
  const proto = (req.headers.get('X-Forwarded-Proto') ?? 'https').split(',')[0].trim();
  Object.assign(req, {
    method: request.method,
    url: request.path + (event.rawQueryString ? `?${event.rawQueryString}` : ''),
    socket: {
      encrypted: proto === 'https',
      remoteAddress: request.sourceIp,
    },
    requestContext: event.requestContext,
    cookies: Object.fromEntries((event.cookies ?? []).map(c => {
      const i = c.indexOf('=');
      return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))];
    })),
  });
  if (event.body === undefined) {
    req.body = '';
  } else if (contentType.startsWith('application/json')) {
    req.body = JSON.parse(event.body);
  } else if (contentType.startsWith('application/x-www-form-urlencoded')) {
    req.body = Object.fromEntries(new URLSearchParams(event.body).entries());
  } else if (contentType.startsWith('multipart/form-data')) {
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : undefined);
    req.files = parseMultipart(bodyBuffer, contentType);
    req.body = '';
  } else {
    req.body = event.body;
  }

  const emitter = new EventEmitter();
  const res = Object.assign(emitter, {
    headers: new Headers(defaultHeaders),
    statusCode: 200,
    statusMessage: '',
    writableEnded: false,
    cookies: [],
    body: undefined,
    getHeaders() {
      return Object.fromEntries(res.headers.entries());
    },
    getHeader(name) { return res.headers.get(name); },
    hasHeader(name) { return res.headers.has(name); },
    setHeader(name, value) { res.headers.set(name, value); },
    removeHeader(name) { res.headers.delete(name); },
    writeHead(code, h = {}) {
      res.statusCode = code;
      for (const [k, v] of Object.entries(h)) res.headers.set(k, v);
    },
    end(value) {
      if (value !== undefined) res.body = value;
      res.writableEnded = true;
      res.emit('finish');
    },
    setCookie(name, value, options) {
      res.cookies.push(serializeCookie(name, value, options));
    },
    clearCookie(name, options = {}) {
      res.cookies.push(serializeCookie(name, '', { ...options, expires: new Date(0) }));
    },
  });
  return { req, res };
};

const toApiGatewayResponse = res => {
  const isBinary = Buffer.isBuffer(res.body) || undefined;
  return {
    statusCode: res.statusCode,
    headers: res.getHeaders(),
    cookies: res.cookies,
    body: isBinary ? res.body.toString('base64') : res.body ?? '',
    isBase64Encoded: isBinary,
  };
};

const ingressApp = new Ingress({ public: false }).start();

export const handler = async event => {
  logger.info('EVENT', JSON.stringify(event, null, 2));
  const { req, res } = createServer(event);
  const method = req.method.toUpperCase();
  if (method === 'OPTIONS') {
    res.end('');
  } else if (['PUT', 'PATCH', 'DELETE'].includes(method)) {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: 'Method Not Allowed' }));
  } else {
    await ingressApp(req, res);
  }
  const response = toApiGatewayResponse(res);
  logger.info('RESPONSE', JSON.stringify(response, null, 2));
  return response;
};
