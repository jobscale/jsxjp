const createHttpError = require('http-errors');
const User = require('../models/User');
const { createHash } = require('.');

class UserService {
  async now() {
    return new Date().toISOString();
  }

  findAll() {
    return User.findAll({
      raw: true,
      attributes: ['login', 'lastLogin'],
      order: ['login'],
    });
  }

  async register(rest) {
    const { login, password } = rest;
    await User.findOne({
      raw: true,
      attributes: ['login'],
      where: {
        login,
      },
    })
    .then(user => {
      if (user) throw createHttpError(400);
    })
    .then(() => {
      const hash = createHash(`${login}/${password}`);
      return User.create({
        login, hash,
      });
    })
    .then(user => ({ login: user.login }));
  }

  async reset(rest) {
    const { login, password } = rest;
    const hash = createHash(`${login}/${password}`);
    return User.update({
      hash,
    }, {
      where: {
        login,
      },
    })
    .then(() => ({ login }));
  }
}

module.exports = {
  UserService,
  userService: new UserService(),
};
