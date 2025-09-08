import Joi from 'joi';

export class Validation {
  async hub(req, res, next) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    await next(req, res);
  }

  async putHub(req, res, next) {
    const { error } = Joi.object({
      hubId: Joi.string().alphanum().max(30),
      hub: Joi.object().required(),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    await next(req, res);
  }

  async putPerson(req, res, next) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
      personId: Joi.string().alphanum().max(30),
      person: Joi.object().required(),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    await next(req, res);
  }

  async removePerson(req, res, next) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
      personId: Joi.string().required().alphanum().max(30),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    await next(req, res);
  }
}

export const validation = new Validation();

export default {
  Validation,
  validation,
};
