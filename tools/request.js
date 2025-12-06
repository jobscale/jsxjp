import { Readable } from 'stream';

export const request = (app, method, url, body = null, headers = {}) => new Promise((resolve) => {
  const req = new Readable();
  req.method = method;
  req.url = url;
  req.headers = { ...headers, host: 'localhost' };
  req.socket = { encrypted: false, remoteAddress: '127.0.0.1' };
  if (body) {
    if (typeof body === 'object') {
      req.push(JSON.stringify(body));
      req.headers['content-type'] = 'application/json';
    } else {
      req.push(body);
    }
  }
  req.push(null);
  const res = {
    statusCode: 200,
    headers: {},
    body: [],
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
    getHeaders() {
      return this.headers;
    },
    writeHead(statusCode, h) {
      this.statusCode = statusCode;
      if (h) {
        for (const [key, value] of Object.entries(h)) {
          this.headers[key.toLowerCase()] = value;
        }
      }
    },
    end(chunk) {
      if (chunk) this.body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      if (this.onFinish) this.onFinish();
      resolve({
        statusCode: this.statusCode,
        headers: this.headers,
        body: Buffer.concat(this.body).toString(),
      });
    },
    write(chunk) {
      this.body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    },
    on(event, cb) {
      if (event === 'finish') this.onFinish = cb;
      if (event === 'close') this.onClose = cb;
      if (event === 'error') this.onError = cb;
    },
    once(event, cb) {
      if (event === 'finish') this.onFinish = cb;
      if (event === 'close') this.onClose = cb;
      if (event === 'error') this.onError = cb;
    },
    emit(event, arg) {
      if (event === 'finish' && this.onFinish) this.onFinish();
      if (event === 'close' && this.onClose) this.onClose();
      if (event === 'error' && this.onError) this.onError(arg);
    },
    writableEnded: false,
  };
  // Hook into end to set writableEnded (like picts.test.js)
  const originalEnd = res.end;
  res.end = function (...args) {
    this.writableEnded = true;
    originalEnd.apply(this, args);
  };
  app(req, res);
});
