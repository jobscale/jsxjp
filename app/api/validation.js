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
      endpoint: Joi.string().required().min(64).max(256),
      expirationTime: Joi.string().allow(null).min(10).max(30),
      keys: Joi.object({
        auth: Joi.string().required().min(16).max(32),
        p256dh: Joi.string().required().min(64).max(128),
      }),
      ts: Joi.string().required().min(10).max(30),
      ua: Joi.string().required().min(4).max(256),
    }).validate(body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    await next(req, res);
  }
}

export const validation = new Validation();

export default { Validation, validation };
