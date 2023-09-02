const Joi = require('joi');
const { login, base32 } = require('../policy');

class Validation {
  login(req, res, next) {
    const { error } = Joi.object({
      login: Joi.string().pattern(login).max(2 ** 5 - 1),
      password: Joi.string().max(2 ** 5 - 1),
      code: Joi.string(),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    next();
  }

  totp(req, res, next) {
    const { error } = Joi.object({
      secret: Joi.string().pattern(base32).min(5).max(2 ** 12 - 1),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    next();
  }
}

module.exports = {
  Validation,
  validation: new Validation(),
};
