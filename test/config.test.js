import { jest } from '@jest/globals';
import createHttpError from 'http-errors';
import { Service } from '../app/config/service.js';
import { db } from '../app/db.js';
import { encode } from '../app/js-proxy.js';

// Mock the methods
db.setValue = jest.fn();
db.getValue = jest.fn();
db.deleteValue = jest.fn();

describe('Service', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new Service();
    process.env.ENV = 'test'; // Set test environment
  });

  describe('register', () => {
    it('should register config with name and data', async () => {
      const rest = { name: 'testConfig', data: 'testData' };
      db.setValue.mockResolvedValue({ key: 'testConfig' });

      const result = await service.register(rest);

      expect(db.setValue).toHaveBeenCalledWith('config', 'testConfig', {
        name: 'testConfig',
        data: 'testData',
        registerAt: expect.any(String),
      });
      expect(result).toEqual({ key: 'testConfig' });
    });

    it('should throw 400 if name is missing', async () => {
      const rest = { data: 'testData' };

      await expect(service.register(rest)).rejects.toThrow(createHttpError(400));
    });

    it('should throw 400 if data is missing', async () => {
      const rest = { name: 'testConfig' };

      await expect(service.register(rest)).rejects.toThrow(createHttpError(400));
    });
  });

  describe('findOne', () => {
    it('should find config by name', async () => {
      const params = { name: 'testConfig' };
      const mockData = { name: 'testConfig', data: 'testData' };
      db.getValue.mockResolvedValue(mockData);

      const result = await service.findOne(params);

      expect(db.getValue).toHaveBeenCalledWith('config', 'testConfig');
      expect(result).toEqual(mockData);
    });

    it('should throw 400 if name is missing', async () => {
      const params = {};

      await expect(service.findOne(params)).rejects.toThrow(createHttpError(400));
    });
  });

  describe('remove', () => {
    it('should remove config by key', async () => {
      const params = { key: 'testConfig' };
      db.deleteValue.mockResolvedValue();

      await service.remove(params);

      expect(db.deleteValue).toHaveBeenCalledWith('config', 'testConfig');
    });

    it('should throw 400 if key is missing', async () => {
      const params = {};

      await expect(service.remove(params)).rejects.toThrow(createHttpError(400));
    });
  });

  describe('getEnv', () => {
    it('should get and decode environment config', async () => {
      const name = 'testConfig';
      const decodedData = '{"key": "value"}';
      const encodedData = encode(decodedData);
      const mockData = { data: encodedData };
      db.getValue.mockResolvedValue(mockData);

      const result = await service.getEnv(name);

      expect(db.getValue).toHaveBeenCalledWith('config', 'testConfig');
      expect(result).toEqual(JSON.parse(decodedData));
    });

    it('should throw if findOne fails', async () => {
      const name = 'testConfig';
      db.getValue.mockResolvedValue(undefined);

      await expect(service.getEnv(name)).rejects.toThrow();
    });
  });
});
