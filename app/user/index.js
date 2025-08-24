import crypto from 'crypto';

export const alg = 'sha512';
export const createHash = plain => crypto.createHash(alg).update(plain).digest('hex');

export default {
  alg,
  createHash,
};
