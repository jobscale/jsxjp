
import { describe, expect, jest, beforeEach } from '@jest/globals';
import createHttpError from 'http-errors';

const mockDb = {
  getValue: jest.fn(),
  setValue: jest.fn(),
};

jest.unstable_mockModule('../app/db.js', () => ({
  db: mockDb,
}));

const { auth } = await import('../app/auth/index.js');
const { service } = await import('../app/auth/service.js');

describe('Auth Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Class', () => {
    const payload = { user: 'test' };
    const secret = 'test-secret';

    it('should sign and verify a token', () => {
      const token = auth.sign(payload, secret);
      expect(token).toBeDefined();
      const verified = auth.verify(token, secret);
      expect(verified).toBe(true);
    });

    it('should decode a token', () => {
      const token = auth.sign(payload, secret);
      const decoded = auth.decode(token);
      expect(decoded).toEqual(payload);
    });

    it('should return false for invalid signature verification', () => {
      const token = auth.sign(payload, secret);
      const verified = auth.verify(token, 'wrong-secret');
      expect(verified).toBe(false);
    });
  });

  describe('Service Class', () => {
    describe('now', () => {
      it('should return a formatted timestamp', async () => {
        const ts = await service.now();
        expect(ts).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      });
    });

    describe('generateCode', () => {
      it('should generate a 6-digit code', () => {
        const code = service.generateCode();
        expect(code).toMatch(/^\d{6}$/);
      });
    });

    describe('verifyCode', () => {
      it('should verify a generated code', () => {
        const code = service.generateCode();
        const verified = service.verifyCode(code);
        expect(verified).toBe(true);
      });

      it('should return false for invalid code', () => {
        const verified = service.verifyCode('000000');
        expect(verified).toBe(false);
      });
    });

    describe('login', () => {
      it('should throw 400 if login or password missing', async () => {
        await expect(service.login({})).rejects.toThrow(createHttpError(400));
        await expect(service.login({ login: 'user' })).rejects.toThrow(createHttpError(400));
      });

      it('should throw 401 if user not found', async () => {
        mockDb.getValue.mockResolvedValue(null);
        await expect(service.login({ login: 'user', password: 'pass' }))
        .rejects.toThrow(createHttpError(401));
      });

      it('should throw 401 if password mismatch', async () => {
        mockDb.getValue.mockResolvedValue({ hash: 'wrong-hash' });
        await expect(service.login({ login: 'user', password: 'pass' }))
        .rejects.toThrow(createHttpError(401));
      });

      it('should login successfully without code if no 2FA', async () => {
        const { createHash } = await import('crypto');
        const hash = createHash('sha3-256').update('user/pass').digest('base64');

        mockDb.getValue.mockResolvedValue({ hash });
        mockDb.setValue.mockResolvedValue({});

        const result = await service.login({ login: 'user', password: 'pass' });
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('multiFactor');
        expect(mockDb.setValue).toHaveBeenCalled();
      });

      it('should throw 401 if code is invalid', async () => {
        const { createHash } = await import('crypto');
        const hash = createHash('sha3-256').update('user/pass').digest('base64');

        mockDb.getValue.mockResolvedValue({ hash });
        await expect(service.login({ login: 'user', password: 'pass', code: '000000' }))
        .rejects.toThrow(createHttpError(401));
      });
    });

    describe('verify', () => {
      it('should verify a valid token', async () => {
        const token = auth.sign({ login: 'user' }, 'node-express-ejs');
        await expect(service.verify(token)).resolves.not.toThrow();
      });

      it('should throw 400 if token is missing', async () => {
        await expect(service.verify()).rejects.toThrow(createHttpError(400));
      });

      it('should throw 403 if token is invalid', async () => {
        const token = auth.sign({ login: 'user' }, 'wrong-secret');
        await expect(service.verify(token)).rejects.toThrow(createHttpError(403));
      });
    });

    describe('decode', () => {
      it('should decode a valid token', async () => {
        const payload = { login: 'user', ts: Date.now() };
        const token = auth.sign(payload, 'node-express-ejs');
        const decoded = await service.decode(token);
        expect(decoded).toMatchObject({ login: 'user' });
      });

      it('should throw 400 if token missing', async () => {
        await expect(service.decode()).rejects.toThrow(createHttpError(400));
      });

      it('should throw 403 if decoding returns null', async () => {
        const originalDecode = auth.decode;
        jest.spyOn(auth, 'decode').mockReturnValue(null);
        await expect(service.decode('invalid-token')).rejects.toThrow(createHttpError(403));
        auth.decode = originalDecode;
      });
    });

    describe('totp', () => {
      it('should generate totp setup', async () => {
        const result = await service.totp({ secret: 'secret' });
        expect(result).toHaveProperty('code');
        expect(result).toHaveProperty('list');
      });
    });

    describe('generateSecret', () => {
      it('should generate a secret', () => {
        const secret = service.generateSecret();
        expect(secret).toBeDefined();
        expect(typeof secret).toBe('string');
      });
    });
  });
});
