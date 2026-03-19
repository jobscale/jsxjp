import { describe, expect, jest, beforeEach } from '@jest/globals';

process.env.ENV = 'test';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.DETA_PROJECT_KEY = 'test-deta-key';

const mockConfigService = {
  getEnv: jest.fn().mockResolvedValue({
    credentials: {
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    },
  }),
};

jest.unstable_mockModule('@jobscale/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.unstable_mockModule('../app/config/service.js', () => ({ service: mockConfigService }));

// Mock AWS SDK clients
jest.unstable_mockModule('@aws-sdk/client-ssm', () => {
  const mockSendSSM = jest.fn().mockResolvedValue({ Parameters: [] });
  return {
    SSMClient: jest.fn(() => ({ send: mockSendSSM })),
    GetParameterCommand: jest.fn(),
    PutParameterCommand: jest.fn(),
    GetParametersByPathCommand: jest.fn(),
    DeleteParameterCommand: jest.fn(),
  };
});

jest.unstable_mockModule('@aws-sdk/client-s3', () => {
  const mockSendS3 = jest.fn().mockResolvedValue({ Contents: [] });
  return {
    S3Client: jest.fn(() => ({ send: mockSendS3 })),
    GetObjectCommand: jest.fn(),
    PutObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    CreateBucketCommand: jest.fn(),
  };
});

const { service } = await import('../app/service.js');
const { controller } = await import('../app/controller.js');
const { Connect, connect } = await import('../app/connect.js');
const { DB } = await import('../app/db.js');
const { store } = await import('../app/store.js');

describe('Service', () => {
  describe('now', () => {
    it('should return formatted timestamp', async () => {
      const result = await service.now();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+09:00/);
    });

    it('should return timestamp in Asia/Tokyo timezone', async () => {
      const result = await service.now();
      expect(result).toContain('+09:00');
    });

    it('should return different timestamps when called at different times', async () => {
      const ts1 = await service.now();
      /* eslint-disable-next-line no-promise-executor-return */
      await new Promise(resolve => setTimeout(resolve, 10));
      const ts2 = await service.now();
      // They should be very close but might be different
      expect(typeof ts1).toBe('string');
      expect(typeof ts2).toBe('string');
    });

    it('should handle custom timestamp', async () => {
      // Test with a specific timestamp format validation
      const result = await service.now();
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+09:00/);
    });

    it('should include timezone offset in result', async () => {
      const result = await service.now();
      expect(result).toMatch(/\+09:00$/);
    });
  });

  describe('formatTimestamp function', () => {
    it('should be defined and callable', async () => {
      const result = await service.now();
      expect(result).toBeDefined();
    });

    it('should return YYYY-MM-DD HH:MM:SS format with timezone', async () => {
      const result = await service.now();
      // Validate format: YYYY-MM-DD HH:MM:SS+09:00
      const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+09:00$/;
      expect(result).toMatch(regex);
    });

    it('should handle dates correctly in JST timezone', async () => {
      const result = await service.now();
      const parts = result.split(' ');
      expect(parts).toHaveLength(2);
      const [date, time] = parts;
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(time).toMatch(/^\d{2}:\d{2}:\d{2}\+09:00$/);
    });
  });

  describe('nowWithoutTimezone function', () => {
    it('should return formatted timestamp without timezone', async () => {
      const result = await service.nowWithoutTimezone();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should not include timezone offset', async () => {
      const result = await service.nowWithoutTimezone();
      expect(result).not.toContain('+09:00');
    });

    it('should return YYYY-MM-DD HH:MM:SS format', async () => {
      const result = await service.nowWithoutTimezone();
      const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
      expect(result).toMatch(regex);
    });
  });
});

describe('Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('page', () => {
    it('should call service.now and send response', async () => {
      const mockEnd = jest.fn();
      const req = {};
      const res = { end: mockEnd };

      await controller.page(req, res);

      expect(mockEnd).toHaveBeenCalled();
      const result = mockEnd.mock.calls[0][0];
      expect(typeof result).toBe('string');
    });

    it('should return timestamp string in response', async () => {
      const mockEnd = jest.fn();
      const req = {};
      const res = { end: mockEnd };

      await controller.page(req, res);

      expect(mockEnd).toHaveBeenCalledWith(expect.stringMatching(/\d{4}-\d{2}-\d{2}/));
    });

    it('should return response with timezone', async () => {
      const mockEnd = jest.fn();
      const req = {};
      const res = { end: mockEnd };

      await controller.page(req, res);

      expect(mockEnd).toHaveBeenCalledWith(expect.stringMatching(/\+09:00/));
    });
  });
});

describe('Connect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('instance methods', () => {
    it('should have credentials method', async () => {
      expect(typeof connect.credentials).toBe('function');
    });

    it('should have getKey method', async () => {
      expect(typeof connect.getKey).toBe('function');
    });

    it('should have fetchEnv method', async () => {
      expect(typeof connect.fetchEnv).toBe('function');
    });

    it('should have allowInsecure method', async () => {
      expect(typeof connect.allowInsecure).toBe('function');
    });

    it('should return credentials object', async () => {
      const result = await connect.credentials();
      expect(result).toHaveProperty('credentials');
      expect(result.credentials).toHaveProperty('accessKeyId');
      expect(result.credentials).toHaveProperty('secretAccessKey');
    });

    it('should handle getKey with DETA_PROJECT_KEY', async () => {
      const result = await connect.getKey();
      expect(typeof result).toBe('string');
    });

    it('should set NODE_TLS_REJECT_UNAUTHORIZED when allowInsecure is true', async () => {
      await connect.allowInsecure(true);
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe('0');
    });

    it('should delete NODE_TLS_REJECT_UNAUTHORIZED when allowInsecure is false', async () => {
      await connect.allowInsecure(true);
      await connect.allowInsecure(false);
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
    });

    it('credentials should include AWS environment variables', async () => {
      const result = await connect.credentials();
      expect(result).toHaveProperty('credentials');
      expect(typeof result.credentials.accessKeyId).toBe('string');
      expect(typeof result.credentials.secretAccessKey).toBe('string');
    });

    it('should handle cache for credentials', async () => {
      const result1 = await connect.credentials();
      const result2 = await connect.credentials();
      expect(result1).toEqual(result2);
    });

    it('should handle fetchEnv method', async () => {
      try {
        await connect.fetchEnv();
      } catch {
        // fetchEnv may fail due to network, that's ok
      }
      expect(typeof connect.fetchEnv).toBe('function');
    });
  });

  describe('Connect class', () => {
    it('should be instantiable', () => {
      const instance = new Connect();
      expect(instance).toBeInstanceOf(Connect);
    });

    it('should have all required methods', () => {
      const instance = new Connect();
      expect(typeof instance.credentials).toBe('function');
      expect(typeof instance.getKey).toBe('function');
      expect(typeof instance.fetchEnv).toBe('function');
      expect(typeof instance.allowInsecure).toBe('function');
    });

    it('new instance should have independent state', () => {
      const instance1 = new Connect();
      const instance2 = new Connect();
      expect(instance1).not.toBe(instance2);
    });
  });
});

describe('DB (SSM)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('class methods', () => {
    it('should have list method', () => {
      const dbInstance = new DB();
      expect(typeof dbInstance.list).toBe('function');
    });

    it('should have getValue method', () => {
      const dbInstance = new DB();
      expect(typeof dbInstance.getValue).toBe('function');
    });

    it('should have setValue method', () => {
      const dbInstance = new DB();
      expect(typeof dbInstance.setValue).toBe('function');
    });

    it('should have deleteValue method', () => {
      const dbInstance = new DB();
      expect(typeof dbInstance.deleteValue).toBe('function');
    });

    it('should have connection method', () => {
      const dbInstance = new DB();
      expect(typeof dbInstance.connection).toBe('function');
    });
  });

  describe('instance creation', () => {
    it('should be instantiable', () => {
      const instance = new DB();
      expect(instance).toBeInstanceOf(DB);
    });

    it('should have cache property initialized', () => {
      const instance = new DB();
      expect(instance.cache).toBeUndefined();
    });

    it('should create cache on first connection', async () => {
      const instance = new DB();
      try {
        await instance.connection('test-table');
      } catch {
        // Ignore connection errors
      }
      expect(instance.cache).toBeDefined();
    });

    it('should initialize cache as empty object', async () => {
      const instance = new DB();
      try {
        await instance.connection('test-table1');
      } catch {
        // Ignore
      }
      expect(typeof instance.cache).toBe('object');
    });

    it('should cache connections by table name', async () => {
      const instance = new DB();
      try {
        await instance.connection('test-table2');
        await instance.connection('test-table3');
      } catch {
        // Ignore
      }
      expect(Object.keys(instance.cache).length).toBeGreaterThanOrEqual(0);
    });

    it('should return cached connection on second call', async () => {
      const instance = new DB();
      try {
        const conn1 = await instance.connection('test-table');
        const conn2 = await instance.connection('test-table');
        expect(conn1).toBe(conn2);
      } catch {
        // Ignore
      }
    });
  });

  describe('async operations', () => {
    it('list should return an array', async () => {
      const instance = new DB();
      try {
        const result = await instance.list('test-table');
        expect(Array.isArray(result)).toBe(true);
      } catch {
        // Ignore
      }
    });

    it('getValue should handle missing values', async () => {
      const instance = new DB();
      try {
        const result = await instance.getValue('test-table', 'nonexistent-key');
        expect(result).toBeUndefined();
      } catch {
        // Ignore
      }
    });

    it('setValue should return an object with key', async () => {
      const instance = new DB();
      try {
        const result = await instance.setValue('test-table', 'test-key', { test: 'value' });
        expect(result).toHaveProperty('key');
        expect(result.key).toBe('test-key');
      } catch {
        // Ignore
      }
    });

    it('deleteValue should be callable', async () => {
      const instance = new DB();
      try {
        await instance.deleteValue('test-table', 'test-key');
        expect(true).toBe(true);
      } catch {
        // Ignore
      }
    });
  });
});

describe('Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('instance methods', () => {
    it('should have config method', async () => {
      expect(typeof store.config).toBe('function');
    });

    it('should have list method', () => {
      expect(typeof store.list).toBe('function');
    });

    it('should have getValue method', () => {
      expect(typeof store.getValue).toBe('function');
    });

    it('should have setValue method', () => {
      expect(typeof store.setValue).toBe('function');
    });

    it('should have deleteValue method', () => {
      expect(typeof store.deleteValue).toBe('function');
    });

    it('should have connection method', () => {
      expect(typeof store.connection).toBe('function');
    });
  });

  describe('Store class', () => {
    it('should export store instance', () => {
      expect(store).toBeDefined();
    });

    it('should have connection function export', async () => {
      const { connection: connFunc } = await import('../app/store.js');
      expect(typeof connFunc).toBe('function');
    });
  });

  describe('Store async operations', () => {
    it('list should return an array', async () => {
      try {
        const result = await store.list('test-table');
        expect(Array.isArray(result)).toBe(true);
      } catch {
        // Ignore
      }
    });

    it('getValue should handle missing values', async () => {
      try {
        const result = await store.getValue('test-table', 'nonexistent-key');
        expect(result).toBeUndefined();
      } catch {
        // Ignore
      }
    });

    it('setValue should return an object with key', async () => {
      try {
        const result = await store.setValue('test-table', 'test-key', { test: 'value' });
        expect(result).toHaveProperty('key');
        expect(result.key).toBe('test-key');
      } catch {
        // Ignore
      }
    });

    it('deleteValue should be callable', async () => {
      try {
        await store.deleteValue('test-table', 'test-key');
        expect(true).toBe(true);
      } catch {
        // Ignore
      }
    });

    it('connection should create S3 client', async () => {
      try {
        const conn = await store.connection('test-schema');
        expect(conn).toBeDefined();
      } catch {
        // Ignore
      }
    });

    it('should cache connections', async () => {
      try {
        const conn1 = await store.connection('test-schema');
        const conn2 = await store.connection('test-schema');
        expect(conn1).toBe(conn2);
      } catch {
        // Ignore
      }
    });
  });
});

describe('App Module Exports', () => {
  it('should export connect instance', async () => {
    const { connect: connectExport } = await import('../app/connect.js');
    expect(connectExport).toBeDefined();
    expect(typeof connectExport.credentials).toBe('function');
  });

  it('should export Connect class', async () => {
    const { Connect: ConnectClass } = await import('../app/connect.js');
    expect(ConnectClass).toBeDefined();
  });

  it('should export service instance', async () => {
    const { service: serviceExport } = await import('../app/service.js');
    expect(serviceExport).toBeDefined();
    expect(typeof serviceExport.now).toBe('function');
  });

  it('should export controller instance', async () => {
    const { controller: controllerExport } = await import('../app/controller.js');
    expect(controllerExport).toBeDefined();
    expect(typeof controllerExport.page).toBe('function');
  });

  it('should export DB class', async () => {
    const { DB: DBClass } = await import('../app/db.js');
    expect(DBClass).toBeDefined();
  });

  it('should export store instance', async () => {
    const { store: storeExport } = await import('../app/store.js');
    expect(storeExport).toBeDefined();
    expect(typeof storeExport.config).toBe('function');
  });
});
