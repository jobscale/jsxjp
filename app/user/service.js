const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { userModel } = require('./model');

const loader = require;
const db = {
  users: path.resolve(__dirname, '../../db/users.json'),
};
const alg = 'sha512';

class UserService {
  findAll() {
    return userModel.findAll();
  }

  async register(rest) {
    const { login, password } = rest;
    delete loader.cache[db.users];
    const { users } = loader(db.users);
    const exist = users.find(user => user.login === login);
    if (exist) {
      const e = new Error('User Already Exists');
      e.status = 400;
      throw e;
    }
    const plain = `${login}/${password}`;
    const hash = crypto.createHash(alg).update(plain).digest('hex');
    users.push({ login, hash });
    fs.writeFileSync(db.users, JSON.stringify({ users }, null, 2));
    return { login };
  }

  async reset(rest) {
    const { login, password } = rest;
    delete loader.cache[db.users];
    const { users } = loader(db.users);
    const exist = users.find(user => user.login === login);
    if (!exist) {
      const e = new Error('User Not Found');
      e.status = 400;
      throw e;
    }
    const plain = `${login}/${password}`;
    const hash = crypto.createHash(alg).update(plain).digest('hex');
    exist.hash = hash;
    fs.writeFileSync(db.users, JSON.stringify({ users }, null, 2));
    return { login: exist.login };
  }
}

module.exports = {
  UserService,
  userService: new UserService(),
};
