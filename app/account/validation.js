const Joi = require('joi');
const { Validation } = require('../validation');

class AccountValidation extends Validation {
  password(req, res, next) {
    const { error } = Joi.object({
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
  AccountValidation,
  accountValidation: new AccountValidation(),
};
