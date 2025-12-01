import { describe, jest } from '@jest/globals';

process.env.ENV = 'test';

const mockDb = {
  getValue: jest.fn(),
  setValue: jest.fn(),
  list: jest.fn(),
  deleteValue: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
};

jest.unstable_mockModule('../app/s3.js', () => ({
  db: mockDb,
}));

jest.unstable_mockModule('@jobscale/logger', () => ({
  logger: mockLogger,
}));

describe('Plan Pulse', () => {
  let service;
  let controller;

  beforeAll(async () => {
    const serviceModule = await import('../app/plan-pulse/service.js');
    service = serviceModule.service; // Use the singleton instance used by controller
    const controllerModule = await import('../app/plan-pulse/controller.js');
    controller = controllerModule.controller;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service', () => {
    describe('putHub', () => {
      it('should create a new hub if hubId is not provided', async () => {
        mockDb.setValue.mockResolvedValue({ key: 'new-hub-id' });
        const result = await service.putHub({ hub: { name: 'test' } });
        expect(result).toEqual({ hubId: 'new-hub-id' });
        expect(mockDb.setValue).toHaveBeenCalled();
      });

      it('should throw 400 if hubId exists but db.getValue returns false', async () => {
        mockDb.getValue.mockResolvedValue(null);
        await expect(service.putHub({ hubId: 'existing-id', hub: {} }))
        .rejects.toThrow();
      });

      it('should update hub if hubId exists and is valid', async () => {
        mockDb.getValue.mockResolvedValue({ name: 'existing' });
        mockDb.setValue.mockResolvedValue({ key: 'existing-id' });
        const result = await service.putHub({ hubId: 'existing-id', hub: { name: 'updated' } });
        expect(result).toEqual({ hubId: 'existing-id' });
      });
    });

    describe('putPerson', () => {
      it('should throw 404 if hub does not exist', async () => {
        mockDb.getValue.mockResolvedValue(null);
        await expect(service.putPerson({ hubId: 'hub-id', person: {} }))
        .rejects.toThrow();
      });

      it('should create new person if personId is not provided', async () => {
        mockDb.getValue.mockResolvedValue({});
        mockDb.setValue.mockResolvedValue({ key: 'new-person-id' });
        const result = await service.putPerson({ hubId: 'hub-id', person: { name: 'test' } });
        expect(result).toEqual({ personId: 'new-person-id' });
      });

      it('should update person if personId is provided and exists', async () => {
        mockDb.getValue
        .mockResolvedValueOnce({}) // hub check
        .mockResolvedValueOnce({ name: 'existing' }); // person check
        mockDb.setValue.mockResolvedValue({ key: 'person-id' });

        const result = await service.putPerson({
          hubId: 'hub-id',
          personId: 'person-id',
          person: { name: 'updated' },
        });
        expect(result).toEqual({ personId: 'person-id' });
      });

      it('should throw 400 if personId is provided but does not exist', async () => {
        mockDb.getValue
        .mockResolvedValueOnce({}) // hub check
        .mockResolvedValueOnce(null); // person check

        await expect(service.putPerson({
          hubId: 'hub-id',
          personId: 'person-id',
          person: {},
        }))
        .rejects.toThrow();
      });
    });

    describe('hub', () => {
      it('should return hub details and persons list', async () => {
        const mockHub = { name: 'hub' };
        const mockPersons = [{ key: 'p1', name: 'person1' }];
        mockDb.getValue.mockResolvedValue(mockHub);
        mockDb.list.mockResolvedValue(mockPersons);

        const result = await service.hub({ hubId: 'hub-id' });
        expect(result).toEqual({
          hubId: 'hub-id',
          hub: mockHub,
          persons: [{ key: 'p1', name: 'person1', personId: 'p1' }],
        });
      });

      it('should throw 404 if hub does not exist', async () => {
        mockDb.getValue.mockResolvedValue(null);
        await expect(service.hub({ hubId: 'hub-id' }))
        .rejects.toThrow();
      });
    });

    describe('removePerson', () => {
      it('should remove person', async () => {
        mockDb.getValue
        .mockResolvedValueOnce({}) // hub check
        .mockResolvedValueOnce({}); // person check
        mockDb.deleteValue.mockResolvedValue({});

        const result = await service.removePerson({ hubId: 'hub-id', personId: 'person-id' });
        expect(result).toEqual({});
        expect(mockDb.deleteValue).toHaveBeenCalled();
      });

      it('should throw 404 if hub does not exist', async () => {
        mockDb.getValue.mockResolvedValue(null);
        await expect(service.removePerson({ hubId: 'hub-id', personId: 'person-id' }))
        .rejects.toThrow();
      });

      it('should throw 400 if person does not exist', async () => {
        mockDb.getValue
        .mockResolvedValueOnce({}) // hub check
        .mockResolvedValueOnce(null); // person check

        await expect(service.removePerson({ hubId: 'hub-id', personId: 'person-id' }))
        .rejects.toThrow();
      });
    });
  });

  describe('Controller', () => {
    let req, res;

    beforeEach(() => {
      req = { body: {} };
      res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
    });

    describe('hub', () => {
      it('should call service.hub and return result', async () => {
        req.body.hubId = 'hub-id';
        const mockResult = { hub: 'data' };
        jest.spyOn(service, 'hub').mockResolvedValue(mockResult);

        await controller.hub(req, res);

        expect(service.hub).toHaveBeenCalledWith({ hubId: 'hub-id' });
        expect(res.json).toHaveBeenCalledWith(mockResult);
      });

      it('should handle errors', async () => {
        const error = new Error('error');
        jest.spyOn(service, 'hub').mockRejectedValue(error);

        await controller.hub(req, res);

        expect(mockLogger.info).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({ message: 'error' });
      });
    });

    describe('putHub', () => {
      it('should call service.putHub and return result', async () => {
        req.body = { hubId: 'id', hub: {} };
        const mockResult = { hubId: 'id' };
        jest.spyOn(service, 'putHub').mockResolvedValue(mockResult);

        await controller.putHub(req, res);

        expect(service.putHub).toHaveBeenCalledWith(req.body);
        expect(res.json).toHaveBeenCalledWith(mockResult);
      });

      it('should handle errors', async () => {
        const error = new Error('error');
        jest.spyOn(service, 'putHub').mockRejectedValue(error);

        await controller.putHub(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
      });
    });

    describe('putPerson', () => {
      it('should call service.putPerson and return result', async () => {
        req.body = { hubId: 'h', personId: 'p', person: {} };
        const mockResult = { personId: 'p' };
        jest.spyOn(service, 'putPerson').mockResolvedValue(mockResult);

        await controller.putPerson(req, res);

        expect(service.putPerson).toHaveBeenCalledWith(req.body);
        expect(res.json).toHaveBeenCalledWith(mockResult);
      });

      it('should handle errors', async () => {
        const error = new Error('error');
        jest.spyOn(service, 'putPerson').mockRejectedValue(error);

        await controller.putPerson(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
      });
    });

    describe('removePerson', () => {
      it('should call service.removePerson and return result', async () => {
        req.body = { hubId: 'h', personId: 'p' };
        const mockResult = {};
        jest.spyOn(service, 'removePerson').mockResolvedValue(mockResult);

        await controller.removePerson(req, res);

        expect(service.removePerson).toHaveBeenCalledWith(req.body);
        expect(res.json).toHaveBeenCalledWith(mockResult);
      });

      it('should handle errors', async () => {
        const error = new Error('error');
        jest.spyOn(service, 'removePerson').mockRejectedValue(error);

        await controller.removePerson(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
      });
    });
  });
});
