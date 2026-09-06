import os from 'os';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import mime from 'mime';
import { logger } from '@jobscale/create-logger';
import createHttpError from 'http-errors';
import { parseCookies } from './parse-cookie.js';
import { route } from './route.js';
import { parseBody } from './parse-body.js';
import { sshConnection } from './ssh-connect.js';

const { ENV } = process.env;

const allowMethods = ['GET', 'POST', 'HEAD'];
const allowHeaders = ['Content-Type'];

const formatTimestamp = (ts = Date.now(), withoutTimezone = false) => {
  const timestamp = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));
  if (withoutTimezone) return timestamp;
  return `${timestamp}+09:00`;
};

export class Ingress {
  constructor(opts = {}) {
    this.opts = { public: true, logging: true, ...opts };
  }

  useHeader(req, res) {
    const { protocol } = req.ensure.url;
    res.setHeader('ETag', 'false');
    if (!res.hasHeader('Server')) res.setHeader('Server', 'acl-ingress-eco-system');
    res.setHeader('X-Env', ENV);
    res.setHeader('X-Host', req.headers.get('Host'));
    res.setHeader('X-Origin', req.headers.get('Origin'));
    res.setHeader('X-Backend-Host', os.hostname());
    if (req.method === 'GET') {
      res.setHeader('Link', '</icon/cat-hand.svg>; rel="icon"; type="image/svg+xml"');
    }
    const inlinePolicy = `nonce-${crypto.randomBytes(7).toString('hex')}`;
    const scheme = protocol === 'http' ? 'http: ws:' : 'https: wss:';
    const allowCdn = [
      'https://cdn.jsdelivr.net',
      'https://esm.sh',
      'https://cdnjs.cloudflare.com',
    ].join(' ');
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-eval' '${inlinePolicy}' ${allowCdn}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data:",
      "media-src 'self' data:",
      `connect-src 'self' ${scheme}`,
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'self'",
    ];
    res.setHeader('Content-Security-Policy', csp.join('; '));
    res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubdomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }

  usePublic(req, res) {
    if (!['GET', 'HEAD'].includes(req.method)) return false;
    const { pathname, search } = req.ensure.url;
    const baseDir = path.join(process.cwd(), 'cdk-app/lib/functions/proxy/docs');
    const file = {
      path: path.join(baseDir, pathname),
    };
    if (!file.path.startsWith(baseDir)) return false;
    file.stat = fs.existsSync(file.path) && fs.statSync(file.path);
    if (!file.stat) return false;
    if (file.stat.isDirectory()) {
      if (!file.path.endsWith('/')) {
        res.writeHead(307, { Location: `${pathname}/${search}` });
        res.end();
        return true;
      }
      file.path += 'index.html';
      file.stat = fs.existsSync(file.path) && fs.statSync(file.path);
      if (!file.stat) return false;
    }
    const contentType = mime.getType(file.path) ?? 'application/octet-stream';
    const contentLength = file.stat.size;
    const stream = fs.createReadStream(file.path);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': contentLength,
    });
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    stream.pipe(res);
    return true;
  }

  useLogging(req, res) {
    const { protocol } = req.ensure.url;
    const globalIp = req.headers.get('X-Forwarded-For')?.split(/[, ]/)[0] || req.socket.remoteAddress;
    const start = Date.now();
    const progress = () => {
      const { method, url } = req;
      logger.info(JSON.stringify({
        ts: formatTimestamp(),
        globalIp, protocol, method, url,
        headers: Object.fromEntries(req.headers.entries()),
      }));
    };
    progress();
    res.on('finish', () => {
      logger.info(JSON.stringify({
        ts: formatTimestamp(),
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        duration: Date.now() - start,
      }));
    });
  }

  async useRoute(req, res) {
    parseCookies(req, res);
    await parseBody(req);
    await route.router.handle(req, res);

    if (res.writableEnded) return;
    this.notfoundHandler(req, res);
  }

  notfoundHandler(req, res) {
    if (req.method === 'GET') {
      const e = createHttpError(404);
      res.writeHead(e.status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(e.message);
      return;
    }
    const e = createHttpError(501);
    res.writeHead(e.status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: e.message }));
  }

  errorHandler(e, req, res) {
    logger.error(e);
    if (req.method === 'GET') {
      e = createHttpError(503);
      res.writeHead(e.status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(e.message);
      return;
    }
    if (!e.status) e = createHttpError(500);
    res.writeHead(e.status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: e.message }));
  }

  upgradeHandler(req, socket, head) {
    if (!(req.headers instanceof Headers)) req.headers = new Headers(req.headers);
    const upgrade = req.headers.get('upgrade');
    logger.info({ url: req.url, upgrade });
    if (upgrade === 'websocket' && req.url.startsWith('/ssh/')) {
      sshConnection(req, socket, head);
      return;
    }
    socket.destroy();
  }

  start() {
    return async (req, res) => Promise.resolve().then(() => {
      if (!(req.headers instanceof Headers)) req.headers = new Headers(req.headers);
      const [protocol] = req.headers.get('X-Forwarded-Proto')?.split(/, /) ?? [req.socket.encrypted ? 'https' : 'http'];
      Object.assign(req, {
        ensure: {
          url: new URL(`${protocol}://${req.headers.get('Host')}${req.url}`),
        },
      });

      if (req.method === 'OPTIONS') {
        const origin = req.headers.get('Origin') ?? `${protocol}://${req.headers.get('Host')}`;
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', allowMethods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', allowHeaders.join(', '));
        res.end('');
        return;
      }
      if (!allowMethods.includes(req.method)) {
        const e = createHttpError(405);
        res.setHeader('Allow', allowMethods.join(', '));
        res.writeHead(e.status, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: e.message }));
        return;
      }

      Object.assign(res, {
        status(code) {
          res.statusCode = code;
          return res;
        },
        json(value) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(value));
        },
        redirect(uri) {
          res.writeHead(307, { Location: uri });
          res.end();
        },
      });

      this.useHeader(req, res);
      if (this.opts.public && this.usePublic(req, res)) return;
      if (this.opts.logging) this.useLogging(req, res);
      this.useRoute(req, res);
    }).catch(e => {
      this.errorHandler(e, req, res);
    });
  }
}

const ingress = new Ingress();
export const app = ingress.start();
const { upgradeHandler, errorHandler } = ingress;
export { upgradeHandler, errorHandler };
export default app;
