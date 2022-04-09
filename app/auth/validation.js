const Joi = require('joi');
const { Validation } = require('../validation');

class AuthValidation extends Validation {
  login(req, res, next) {
    const { error } = Joi.object({
      login: Joi.string().alphanum().max(30),
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
  AuthValidation,
  authValidation: new AuthValidation(),
};
