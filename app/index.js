import os from 'os';
import path from 'path';
import fs from 'fs';
import createHttpError from 'http-errors';
import { logger } from '@jobscale/logger';
import { parseCookies } from './parse-cookie.js';
import { route } from './route.js';
import { parseBody } from './parse-body.js';

const { XDG_SESSION_DESKTOP } = process.env;

export class Ingress {
  useHeader(req, res) {
    const headers = new Headers(req.headers);
    const protocol = req.socket.encrypted ? 'https' : 'http';
    const host = headers.get('host');
    const origin = headers.get('origin') || `${protocol}://${host}`;
    res.setHeader('ETag', 'false');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Server', 'acl-ingress-k8s');
    res.setHeader('X-Backend-Host', os.hostname());
    const csp = [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: wss:",
      "base-uri 'none'",
    ];
    if (!['plasma', 'cinnamon'].includes(XDG_SESSION_DESKTOP)) {
      res.setHeader('Content-Security-Policy', csp.join('; '));
    } else {
      res.setHeader('Content-Security-Policy', csp.map(v => v.replace('https:', 'http:')).map(v => v.replace('wss:', 'ws:')).join('; '));
    }
    res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubdomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }

  usePublic(req, res) {
    const headers = new Headers(req.headers);
    const { url } = req;
    const protocol = req.socket.encrypted ? 'https' : 'http';
    const host = headers.get('host');
    const { pathname } = new URL(`${protocol}://${host}${url}`);
    const file = {
      path: path.join(process.cwd(), 'docs', pathname),
    };
    if (!fs.existsSync(file.path)) return false;
    const stats = fs.statSync(file.path);
    if (stats.isDirectory()) {
      if (!file.path.endsWith('/')) {
        res.writeHead(307, { Location: `${url}/` });
        res.end();
        return true;
      }
      file.path += 'index.html';
    }
    const mime = filePath => {
      const ext = path.extname(filePath).toLowerCase();
      if (['.png', '.jpeg', '.webp', '.gif'].includes(ext)) return `image/${ext}`;
      if (['.jpg'].includes(ext)) return 'image/jpeg';
      if (['.ico'].includes(ext)) return 'image/x-ico';
      if (['.json'].includes(ext)) return 'application/json';
      if (['.pdf'].includes(ext)) return 'application/pdf';
      if (['.zip'].includes(ext)) return 'application/zip';
      if (['.xml'].includes(ext)) return 'application/xml';
      if (['.html', '.svg'].includes(ext)) return 'text/html';
      if (['.js'].includes(ext)) return 'text/javascript';
      if (['.css'].includes(ext)) return 'text/css';
      if (['.txt', '.md'].includes(ext)) return 'text/plain';
      return 'application/octet-stream';
    };
    const stream = fs.createReadStream(file.path);
    res.writeHead(200, {
      'Content-Type': mime(file.path),
      'Content-Length': fs.statSync(file.path).size,
    });
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    stream.pipe(res);
    return true;
  }

  useLogging(req, res) {
    const ts = new Date().toISOString();
    const progress = () => {
      const headers = new Headers(req.headers);
      const ip = req.socket.remoteAddress || req.ip;
      const remoteIp = headers.get('X-Real-Ip') || headers.get('X-Forwarded-For') || ip;
      const { method, url } = req;
      const protocol = req.socket.encrypted ? 'https' : 'http';
      const host = headers.get('host');
      logger.info({
        ts,
        req: JSON.stringify({
          remoteIp, protocol, host, method, url,
        }),
        headers: JSON.stringify(Object.fromEntries(headers.entries())),
      });
    };
    progress();
    res.on('finish', () => {
      const { statusCode, statusMessage } = res;
      const headers = JSON.stringify(res.getHeaders());
      logger.info({
        ts, statusCode, statusMessage, headers,
      });
    });
  }

  async useRoute(req, res) {
    const headers = new Headers(req.headers);
    const method = req.method.toUpperCase();
    const protocol = req.socket.encrypted ? 'https' : 'http';
    const host = headers.get('host');
    const { pathname, searchParams } = new URL(`${protocol}://${host}${req.url}`);
    const pathRoute = `${method} ${pathname}`;
    logger.debug({ pathRoute, searchParams });

    res.contentType = contentType => {
      res.setHeader('Content-Type', contentType);
    };
    res.status = code => {
      res.statusCode = code;
      return res;
    };
    res.json = any => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(any));
    };
    res.redirect = uri => {
      res.writeHead(307, { Location: uri });
      res.end();
    };

    parseCookies(req, res);
    await parseBody(req);
    await route.router.handle(req, res);

    if (res.writableEnded) return;
    this.notfoundHandler(req, res);
  }

  notfoundHandler(req, res) {
    if (req.method === 'GET') {
      const e = createHttpError(404);
      res.writeHead(e.status, { 'Content-Type': 'text/plain' });
      res.end(e.message);
      return;
    }
    const e = createHttpError(501);
    res.writeHead(e.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: e.message }));
  }

  errorHandler(e, req, res) {
    logger.error(e);
    if (!res) return;
    if (req.method === 'GET') {
      e = createHttpError(503);
      res.writeHead(e.status, { 'Content-Type': 'text/plain' });
      res.end(e.message);
      return;
    }
    if (!e.status) e = createHttpError(500);
    res.writeHead(e.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: e.message }));
  }

  start() {
    return async (req, res) => {
      try {
        this.useHeader(req, res);
        if (this.usePublic(req, res)) return;
        this.useLogging(req, res);
        await this.useRoute(req, res);
      } catch (e) {
        this.errorHandler(e, req, res);
      }
    };
  }
}

const ingress = new Ingress();
export const app = ingress.start();
const { upgradeHandler, errorHandler } = ingress;
export { upgradeHandler, errorHandler };
export default app;
