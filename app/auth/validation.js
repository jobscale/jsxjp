const Joi = require('joi');
const { login } = require('../policy');

class Validation {
  login(req, res, next) {
    const { error } = Joi.object({
      login: Joi.string().pattern(login).max(30),
      password: Joi.string().max(30),
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
