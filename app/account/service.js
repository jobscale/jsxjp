const createHttpError = require('http-errors');
const { auth } = require('../auth');
const { createHash } = require('../user');
const User = require('../models/User');

class AccountService {
  async password(rest) {
    const { password, token } = rest;
    const { login } = auth.decode(token);
    return User.findOne({
      raw: true,
      attributes: ['login'],
      where: { login },
    })
    .then(user => {
      if (!user) throw createHttpError(400);
      user.hash = createHash(`${login}/${password}`);
      return User.update(user, {
        where: { login },
      });
    })
    .then(() => ({ login }));
  }
}

module.exports = {
  AccountService,
  accountService: new AccountService(),
};
