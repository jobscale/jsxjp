/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};
jest.unstable_mockModule('@jobscale/logger', () => ({ logger: mockLogger }));

describe('Template Module', () => {
  let request;
  let app;

  beforeAll(async () => {
    process.env.ENV = 'test';
    request = (await import('supertest')).default;
    const module = await import('../app/index.js');
    app = module.app;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /template renders view', async () => {
    const res = await request(app)
    .post('/template')
    .send({ id: 'test-view' });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/^<html>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+9<\/html>\n$/);
  });
});
