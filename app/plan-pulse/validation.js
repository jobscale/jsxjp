const Joi = require('joi');

class Validation {
  hub(req, res, next) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    next();
  }

  putHub(req, res, next) {
    const { error } = Joi.object({
      hubId: Joi.string().alphanum().max(30),
      hub: Joi.object().required(),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    next();
  }

  putPerson(req, res, next) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
      personId: Joi.string().alphanum().max(30),
      person: Joi.object().required(),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    next();
  }

  removePerson(req, res, next) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
      personId: Joi.string().required().alphanum().max(30),
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
