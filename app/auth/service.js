const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Service } = require('../service');
const { authModel } = require('./model');

const loader = require;
const jwtSecret = 'node-express-ejs';
const hashKey = 'AS2P8AcBedZ';
const db = {
  users: path.resolve(__dirname, '../../db/users.json'),
};
const alg = 'sha512';

class AuthService extends Service {
  login(rest) {
    const { login, password } = rest;
    const ts = new Date().toLocaleString();
    delete loader.cache[db.users];
    const { users } = loader(db.users);
    this.refactorUsers(users);
    const plain = `${login}/${password}`;
    const hash = crypto.createHash(alg).update(plain).digest('hex');
    const kickoff = () => {
      if (users.length > 200) return undefined;
      const user = { login, hash };
      users.push(user);
      return user;
    };
    const user = users.find(item => item.login === login && item.hash === hash) || kickoff();
    if (!user) {
      const e = new Error('Unauthorized');
      e.status = 401;
      throw e;
    }
    user.lastLogin = ts;
    fs.writeFileSync(db.users, JSON.stringify({ users }, null, 2));
    const token = authModel.sign({ login, ts }, jwtSecret);
    return Promise.resolve(token);
  }

  refactorUsers(users) {
    users.forEach(user => {
      if (user.hash) return;
      const plain = `${user.login}/${user.password || hashKey}`;
      user.hash = crypto.createHash(alg).update(plain).digest('hex');
      delete user.password;
    });
  }

  async verify(token) {
    if (!authModel.verify(token, jwtSecret)) throw new Error('Unauthorized');
  }
}

module.exports = {
  AuthService,
  authService: new AuthService(),
};
