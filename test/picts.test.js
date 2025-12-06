import { Readable } from 'stream';
import { describe, expect, jest } from '@jest/globals';

process.env.ENV = 'test';

// Mock dependencies
const mockS3Client = {
  send: jest.fn(),
};

const mockSharp = jest.fn(() => ({
  metadata: jest.fn().mockResolvedValue({ format: 'jpeg' }),
  resize: jest.fn().mockReturnThis(),
  toFormat: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail-buffer')),
}));

const mockAuthService = {
  decode: jest.fn().mockResolvedValue({ login: 'test-user' }),
  verify: jest.fn().mockResolvedValue(),
  login: jest.fn(),
  totp: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Use unstable_mockModule for ESM mocking
jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => mockS3Client),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  CreateBucketCommand: jest.fn(),
}));

jest.unstable_mockModule('sharp', () => ({
  default: mockSharp,
}));

jest.unstable_mockModule('../app/auth/service.js', () => ({
  service: mockAuthService,
}));

jest.unstable_mockModule('@jobscale/logger', () => ({
  logger: mockLogger,
}));

// Mock shorten route to avoid pulling in jsdom via shorten/service.js
jest.unstable_mockModule('../app/shorten/route.js', () => ({
  route: {
    router: {
      routes: [],
    },
  },
}));

// Mock config service to bypass DB access
jest.unstable_mockModule('../app/config/service.js', () => ({
  service: {
    getEnv: jest.fn().mockResolvedValue({}),
  },
}));

// Import app after mocking
const { app } = await import('../app/index.js');
const { PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

describe('Picts Routing via app/index.js', () => {
  // Helper function to simulate HTTP requests
  const request = (method, url, body = null, headers = {}) => new Promise((resolve) => {
    const req = new Readable();
    req.method = method;
    req.url = url;
    req.headers = { ...headers, host: 'localhost' };
    req.socket = { encrypted: false, remoteAddress: '127.0.0.1' };

    // Cookie mock for auth
    req.headers.cookie = 'token=mock-token';

    if (body) {
      if (Buffer.isBuffer(body)) {
        req.push(body);
      } else if (typeof body === 'object') {
        const json = JSON.stringify(body);
        req.push(json);
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
      end(chunk) {
        if (chunk) this.body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        // Emit finish event as real response does
        if (this.onFinish) this.onFinish();
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: Buffer.concat(this.body).toString(),
          buffer: Buffer.concat(this.body),
        });
      },
      write(chunk) {
        this.body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      },
      on(event, cb) {
        if (event === 'finish') this.onFinish = cb;
      },
      once(event, cb) {
        if (event === 'finish') this.onFinish = cb;
      },
      emit(event) {
        if (event === 'finish' && this.onFinish) this.onFinish();
      },
      writableEnded: false,
    };

    // Hook into end to set writableEnded
    const originalEnd = res.end;
    res.end = function (...args) {
      this.writableEnded = true;
      originalEnd.apply(this, args);

      const bodyStr = Buffer.concat(this.body).toString();
      resolve({
        statusCode: this.statusCode,
        headers: this.headers,
        body: bodyStr,
        buffer: Buffer.concat(this.body),
      });
    };

    app(req, res);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Client.send.mockReset();
  });

  describe('POST /picts/find', () => {
    it('should return list of images', async () => {
      mockS3Client.send.mockResolvedValue({
        Contents: [
          { Key: 'test-user/thumbnail/image1.jpg' },
          { Key: 'test-user/thumbnail/image2.jpg' },
        ],
      });

      const res = await request('POST', '/picts/find');

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data).toEqual({ images: ['image1.jpg', 'image2.jpg'] });
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(ListObjectsV2Command));
    });

    it('should handle errors', async () => {
      mockS3Client.send.mockReset();
      mockS3Client.send
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('S3 Error'));
      const res = await request('POST', '/picts/find');
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ images: [] });
    });
  });

  describe('POST /picts/upload', () => {
    it('should upload files', async () => {
      const boundary = '--------------------------testboundary';
      const fileContent = 'file-content';
      const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from('Content-Disposition: form-data; name="files"; filename="test.jpg"\r\n'),
        Buffer.from('Content-Type: image/jpeg\r\n\r\n'),
        Buffer.from(fileContent),
        Buffer.from('\r\n'),
        Buffer.from(`--${boundary}--\r\n`),
      ]);

      mockS3Client.send.mockResolvedValue({});

      const res = await request('POST', '/picts/upload', body, {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ ok: true });
      expect(mockSharp).toHaveBeenCalled();
      // Should invoke PutObjectCommand twice (original + thumbnail) per file
      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });
  });

  describe('POST /picts/remove', () => {
    it('should remove file', async () => {
      mockS3Client.send.mockResolvedValue({});

      const res = await request('POST', '/picts/remove', { name: 'test.jpg' });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ ok: true });
      // Should invoke DeleteObjectCommand twice (original + thumbnail)
      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });
  });

  describe('POST /picts/getData', () => {
    it('should get dataset', async () => {
      const datasetItem = { some: 'data' };
      const stream = new Readable();
      stream.push(JSON.stringify(datasetItem));
      stream.push(null);

      mockS3Client.send.mockResolvedValueOnce({
        Body: stream,
      });

      const res = await request('POST', '/picts/getData', [{ name: 'data1' }]);

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data).toEqual({ data1: datasetItem });
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });
  });

  describe('POST /picts/putData', () => {
    it('should put dataset', async () => {
      mockS3Client.send.mockResolvedValue({});

      const res = await request('POST', '/picts/putData', { data1: { some: 'val' } });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ ok: true });
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });
  });

  describe('GET /picts/i/:fname', () => {
    // Note: The router uses pattern matching.
    // app/picts/route.js: router.add('GET', '/:type/:fname', ...)
    // And app/index.js routes /picts/* to picts router.
    // So /picts/i/image.jpg matches.

    it('should return image content', async () => {
      const imageBuffer = Buffer.from('image-data');
      const stream = new Readable();
      stream.push(imageBuffer);
      stream.push(null);

      mockS3Client.send.mockResolvedValueOnce({
        ContentType: 'image/jpeg',
        Body: stream,
      });

      const res = await request('GET', '/picts/i/test.jpg');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/jpeg');
      expect(res.buffer).toEqual(imageBuffer);
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });

    it('should return thumbnail content', async () => {
      const imageBuffer = Buffer.from('thumb-data');
      const stream = new Readable();
      stream.push(imageBuffer);
      stream.push(null);

      mockS3Client.send.mockResolvedValueOnce({
        ContentType: 'image/jpeg',
        Body: stream,
      });

      const res = await request('GET', '/picts/thumbnail/test.jpg');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/jpeg');
      expect(res.buffer).toEqual(imageBuffer);
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });

    it('should handle 404 from S3', async () => {
      const err = new Error('Not Found');
      err.$metadata = { httpStatusCode: 404 }; // Simulating AWS error
      // Or cleaner, the service might just throw.
      // Controller catches and sets status.
      // Actually service.image sends GetObjectCommand.
      mockS3Client.send.mockRejectedValueOnce(err);

      const res = await request('GET', '/picts/i/missing.jpg');
      // controller sets 404 if error doesn't have status, or uses error status.
      // AWS errors usually don't have .status, but .statusCode or similar.
      // Logic in controller: if (!e.status) e.status = 404;
      expect(res.statusCode).toBe(404);
    });
  });
});
