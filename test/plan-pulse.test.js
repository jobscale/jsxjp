
import { describe, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';

process.env.ENV = 'test';

const mockDb = {
  getValue: jest.fn(),
  setValue: jest.fn(),
  list: jest.fn(),
  deleteValue: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule('../app/s3.js', () => ({
  db: mockDb,
}));

jest.unstable_mockModule('@jobscale/logger', () => ({
  logger: mockLogger,
}));

// Mock other routes
const mockRouter = {
  router: {
    routes: [],
  },
};
jest.unstable_mockModule('../app/shorten/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/ip/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/api/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/account/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/user/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/template/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/picts/route.js', () => ({ route: mockRouter }));
jest.unstable_mockModule('../app/auth/route.js', () => ({ route: mockRouter }));

const { app } = await import('../app/index.js');

describe('Plan Pulse Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /plan-pulse/hub', () => {
    it('should return hub details and persons list', async () => {
      const mockHub = { name: 'hub' };
      const mockPersons = [{ key: 'p1', name: 'person1' }];
      mockDb.getValue.mockResolvedValue(mockHub);
      mockDb.list.mockResolvedValue(mockPersons);

      const res = await request(app)
      .post('/plan-pulse/hub')
      .send({ hubId: 'hubId1' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        hubId: 'hubId1',
        hub: mockHub,
        persons: [{ key: 'p1', name: 'person1', personId: 'p1' }],
      });
    });

    it('should throw 404 if hub does not exist', async () => {
      mockDb.getValue.mockResolvedValue(null);
      const res = await request(app)
      .post('/plan-pulse/hub')
      .send({ hubId: 'missingHub' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /plan-pulse/putHub', () => {
    it('should create a new hub if hubId is not provided', async () => {
      mockDb.setValue.mockResolvedValue({ key: 'newHubId' });

      const res = await request(app)
      .post('/plan-pulse/putHub')
      .send({ hub: { name: 'test' } });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ hubId: 'newHubId' });
    });

    it('should update hub if hubId exists (mock behavior reflects new ID generation behavior)', async () => {
      mockDb.getValue.mockResolvedValue({ name: 'existing' });
      mockDb.setValue.mockResolvedValue({ key: 'updatedId' });

      const res = await request(app)
      .post('/plan-pulse/putHub')
      .send({ hubId: 'existingId', hub: { name: 'updated' } });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ hubId: 'updatedId' });
    });

    it('should throw 400 if hubId exists but db.getValue returns false', async () => {
      mockDb.getValue.mockResolvedValue(null);
      const res = await request(app)
      .post('/plan-pulse/putHub')
      .send({ hubId: 'existingId', hub: {} });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /plan-pulse/putPerson', () => {
    it('should create new person if personId is not provided', async () => {
      mockDb.getValue.mockResolvedValue({}); // Hub exists
      mockDb.setValue.mockResolvedValue({ key: 'newPersonId' });

      const res = await request(app)
      .post('/plan-pulse/putPerson')
      .send({ hubId: 'hubId1', person: { name: 'test' } });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ personId: 'newPersonId' });
    });

    it('should update person if personId is provided and exists', async () => {
      mockDb.getValue
      .mockResolvedValueOnce({}) // hub check
      .mockResolvedValueOnce({ name: 'existing' }); // person check
      mockDb.setValue.mockResolvedValue({ key: 'personId1' });

      const res = await request(app)
      .post('/plan-pulse/putPerson')
      .send({
        hubId: 'hubId1',
        personId: 'personId1',
        person: { name: 'updated' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ personId: 'personId1' });
    });

    it('should throw 404 if hub does not exist', async () => {
      mockDb.getValue.mockResolvedValue(null);
      const res = await request(app)
      .post('/plan-pulse/putPerson')
      .send({ hubId: 'hubId1', person: {} });

      expect(res.statusCode).toBe(404);
    });

    it('should throw 400 if personId is provided but does not exist', async () => {
      mockDb.getValue
      .mockResolvedValueOnce({}) // hub check
      .mockResolvedValueOnce(null); // person check

      const res = await request(app)
      .post('/plan-pulse/putPerson')
      .send({
        hubId: 'hubId1',
        personId: 'personId1',
        person: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /plan-pulse/removePerson', () => {
    it('should remove person', async () => {
      mockDb.getValue
      .mockResolvedValueOnce({}) // hub check
      .mockResolvedValueOnce({}); // person check
      mockDb.deleteValue.mockResolvedValue({});

      const res = await request(app)
      .post('/plan-pulse/removePerson')
      .send({ hubId: 'hubId1', personId: 'personId1' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({});
      expect(mockDb.deleteValue).toHaveBeenCalled();
    });

    it('should throw 404 if hub does not exist', async () => {
      mockDb.getValue.mockResolvedValue(null);
      const res = await request(app)
      .post('/plan-pulse/removePerson')
      .send({ hubId: 'hubId1', personId: 'personId1' });

      expect(res.statusCode).toBe(404);
    });

    it('should throw 400 if person does not exist', async () => {
      mockDb.getValue
      .mockResolvedValueOnce({}) // hub check
      .mockResolvedValueOnce(null); // person check

      const res = await request(app)
      .post('/plan-pulse/removePerson')
      .send({ hubId: 'hubId1', personId: 'personId1' });

      expect(res.statusCode).toBe(400);
    });
  });
});
