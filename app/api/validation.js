const Joi = require('joi');

class Validation {
  slack(req, res, next) {
    const { body } = req;
    const { error } = Joi.object({
      text: Joi.string().required().min(1).max(2 ** 16 - 1),
      icon_emoji: Joi.string(),
      username: Joi.string(),
      attachments: Joi.any(),
    }).validate(body);
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
