/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('jsdom', () => ({
  JSDOM: class {
    constructor() {
      this.window = { document: {} };
    }
  },
}));

describe('IP Module', () => {
  let request;
  let app;

  beforeAll(async () => {
    process.env.ENV = 'test';
    request = (await import('supertest')).default;
    const module = await import('../app/index.js');
    app = module.app;
  });

  it('GET /ip returns headers X-Real-Ip', async () => {
    const res = await request(app)
    .get('/ip')
    .set('X-Real-Ip', '10.0.0.1');
    expect(res.status).toBe(200);
    expect(res.text).toBe('10.0.0.1');
  });

  it('GET /ip returns headers X-Forwarded-For', async () => {
    const res = await request(app)
    .get('/ip')
    .set('X-Forwarded-For', '10.0.0.2');
    expect(res.status).toBe(200);
    expect(res.text).toBe('10.0.0.2');
  });

  it('GET /ip returns socket IP if no headers', async () => {
    const res = await request(app).get('/ip');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/127\.0\.0\.1|::1/);
  });
});
