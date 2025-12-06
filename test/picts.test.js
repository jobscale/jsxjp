
import { describe, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';

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

jest.unstable_mockModule('sharp', () => ({ default: mockSharp }));
jest.unstable_mockModule('../app/auth/service.js', () => ({ service: mockAuthService }));
jest.unstable_mockModule('@jobscale/logger', () => ({ logger: mockLogger }));

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

      const res = await request(app)
      .post('/picts/find')
      .set('Cookie', 'token=mock-token');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ images: ['image1.jpg', 'image2.jpg'] });
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(ListObjectsV2Command));
    });

    it('should handle errors', async () => {
      mockS3Client.send.mockReset();
      mockS3Client.send
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('S3 Error'));
      const res = await request(app)
      .post('/picts/find')
      .set('Cookie', 'token=mock-token');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ images: [] });
    });
  });

  describe('POST /picts/upload', () => {
    it('should upload files', async () => {
      mockS3Client.send.mockResolvedValue({});

      const res = await request(app)
      .post('/picts/upload')
      .set('Cookie', 'token=mock-token')
      .attach('files', Buffer.from('file-content'), 'test.jpg');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(mockSharp).toHaveBeenCalled();
      // Should invoke PutObjectCommand twice (original + thumbnail) per file
      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });
  });

  describe('POST /picts/remove', () => {
    it('should remove file', async () => {
      mockS3Client.send.mockResolvedValue({});

      const res = await request(app)
      .post('/picts/remove')
      .set('Cookie', 'token=mock-token')
      .send({ name: 'test.jpg' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ ok: true });
      // Should invoke DeleteObjectCommand twice (original + thumbnail)
      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });
  });

  describe('POST /picts/getData', () => {
    it('should get dataset', async () => {
      const datasetItem = { some: 'data' };
      // S3 Body stream mock for supertest consumer
      // The app reads stream and pipes to res, or consumes it.
      // app/picts/controller.js getData:
      // const { Body } = await s3.send(new GetObjectCommand(...));
      // if (Body) Body.pipe(res); ??
      // Actually if it's JSON dataset, controller probably reads it and sends JSON?
      // "GET /picts/getData" is likely retrieving a JSON file.
      // But let's check current test expectation: `expect(data).toEqual({ data1: datasetItem });`
      // It sends `[{ name: 'data1' }]`.
      // The mock returns a stream.
      // If the app pipes the stream to res, supertest will receive it.
      // Since it's piping JSON content, let's see if supertest parses it.
      // If content-type is not set, supertest might treat as text.
      // The current mock doesn't set ContentType for getData.

      const { Readable } = await import('stream');
      const stream = new Readable();
      stream.push(JSON.stringify(datasetItem));
      stream.push(null);

      mockS3Client.send.mockResolvedValueOnce({
        Body: stream,
      });

      const res = await request(app)
      .post('/picts/getData')
      .set('Cookie', 'token=mock-token')
      .send([{ name: 'data1' }]);

      expect(res.statusCode).toBe(200);
      // If the endpoint pipes content directly, and no content-type is set, it might be text.
      // If it is JSON, we can parse res.text.
      // But wait, the previous test did `JSON.parse(res.body)`. `res.body` in manual mock was string.
      // Here res.body might be object if content-type is json.
      // If not, use JSON.parse(res.text).
      // Let's assume it might parse it if valid json, or we check both.
      // Using `JSON.parse(res.text)` is safer if we are unsure about content-type header from S3 mock.
      // If S3 mock doesn't provide ContentType, app might not set it on response.

      const data = res.body && Object.keys(res.body).length > 0 ? res.body : JSON.parse(res.text);
      expect(data).toEqual({ data1: datasetItem });
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });
  });

  describe('POST /picts/putData', () => {
    it('should put dataset', async () => {
      mockS3Client.send.mockResolvedValue({});

      const res = await request(app)
      .post('/picts/putData')
      .set('Cookie', 'token=mock-token')
      .send({ data1: { some: 'val' } });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });
  });

  describe('GET /picts/i/:fname', () => {
    it('should return image content', async () => {
      const imageBuffer = Buffer.from('image-data');
      const { Readable } = await import('stream');
      const stream = new Readable();
      stream.push(imageBuffer);
      stream.push(null);

      mockS3Client.send.mockResolvedValueOnce({
        ContentType: 'image/jpeg',
        Body: stream,
      });

      const res = await request(app)
      .get('/picts/i/test.jpg')
      .set('Cookie', 'token=mock-token');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/jpeg');
      expect(res.body).toEqual(imageBuffer);
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });

    it('should return thumbnail content', async () => {
      const imageBuffer = Buffer.from('thumb-data');
      const { Readable } = await import('stream');
      const stream = new Readable();
      stream.push(imageBuffer);
      stream.push(null);

      mockS3Client.send.mockResolvedValueOnce({
        ContentType: 'image/jpeg',
        Body: stream,
      });

      const res = await request(app)
      .get('/picts/thumbnail/test.jpg')
      .set('Cookie', 'token=mock-token');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/jpeg');
      expect(res.body).toEqual(imageBuffer);
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });

    it('should handle 404 from S3', async () => {
      const err = new Error('Not Found');
      err.$metadata = { httpStatusCode: 404 };
      mockS3Client.send.mockRejectedValueOnce(err);

      const res = await request(app)
      .get('/picts/i/missing.jpg')
      .set('Cookie', 'token=mock-token');

      expect(res.statusCode).toBe(404);
    });
  });
});
