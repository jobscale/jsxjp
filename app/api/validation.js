import Joi from 'joi';

export class Validation {
  async slack(req, res, next) {
    const { body } = req;
    const { error } = Joi.object({
      text: Joi.string().required().min(1).max(2 ** 16 - 1),
      blocks: Joi.array(),
      icon_emoji: Joi.string(),
      username: Joi.string(),
      channel: Joi.string(),
      attachments: Joi.any(),
    }).validate(body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    await next(req, res);
  }

  async email(req, res, next) {
    const { body } = req;
    const { error } = Joi.object({
      subject: Joi.string().required().min(1).max(2 ** 8 - 1),
      text: Joi.string().required().min(1).max(2 ** 16 - 1),
    }).validate(body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    await next(req, res);
  }

  async subscription(req, res, next) {
    const { body } = req;
    const { error } = Joi.object({
      subscription: Joi.string().required().min(1).max(2 ** 16 - 1),
    }).validate(body);
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
