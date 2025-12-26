import { Readable, Writable } from 'stream';
import { Socket } from 'net';
import { logger } from '@jobscale/logger';
import { app } from './app/index.js';

export const handler = async event => {
  logger.info('EVENT', event);
  return new Promise(resolve => {
    // Request
    const req = new Readable({ read() {} });
    req.url = event.rawPath + (event.rawQueryString ? `?${event.rawQueryString}` : '');
    req.method = event.requestContext?.http?.method || 'GET';
    req.headers = Object.fromEntries(
      Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v]),
    );
    if (event.cookies) {
      req.headers.cookie = event.cookies.join('; ');
    }
    req.socket = new Socket();
    if (event.body) {
      const body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : Buffer.from(event.body);
      req.push(body);
    }
    req.push(null);

    // Response
    const responseChunks = [];
    const res = new Writable();
    res.writeHead = (statusCode, headers) => {
      res.statusCode = statusCode;
      res.headers = headers;
    };
    res.setHeader = (key, value) => {
      res.headers = res.headers || {};
      if (key.toLowerCase() === 'set-cookie') {
        res.cookies = Array.isArray(value) ? value : [value];
      } else {
        res.headers[key] = value;
      }
    };
    res.write = chunk => {
      responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    };
    res.end = chunk => {
      if (chunk) res.write(chunk);
      const buffer = Buffer.concat(responseChunks);
      const contentType = res.headers?.['Content-Type'] || res.headers?.['content-type'];
      const isBinary = contentType && /^image\//.test(contentType);
      resolve({
        statusCode: res.statusCode || 200,
        headers: res.headers || {},
        cookies: res.cookies || [],
        body: isBinary ? buffer.toString('base64') : buffer.toString(),
        isBase64Encoded: isBinary,
      });
    };
    app(req, res);
  });
};
