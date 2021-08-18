const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Service } = require('./service');
const { authModel } = require('../models/auth');

const loader = require;
const db = {
  users: path.resolve(__dirname, '../../db/users.json'),
};
const alg = 'sha512';

class AccountService extends Service {
  async password(rest) {
    const { password, token } = rest;
    const iam = authModel.decode(token);
    delete loader.cache[db.users];
    const { users } = loader(db.users);
    const exist = users.find(user => user.login === iam.login);
    if (!exist) {
      const e = new Error('Bad Request');
      e.status = 400;
      throw e;
    }
    const plain = `${exist.login}/${password}`;
    const hash = crypto.createHash(alg).update(plain).digest('hex');
    exist.hash = hash;
    fs.writeFileSync(db.users, JSON.stringify({ users }, null, 2));
    return exist;
  }
}

module.exports = {
  AccountService,
  accountService: new AccountService(),
};
