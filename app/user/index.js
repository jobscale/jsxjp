const crypto = require('crypto');

const alg = 'sha512';

module.exports = {
  alg,
  createHash: plain => crypto.createHash(alg).update(plain).digest('hex'),
};
