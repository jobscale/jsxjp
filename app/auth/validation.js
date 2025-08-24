import Joi from 'joi';
import { login, base32 } from '../policy.js';

export class Validation {
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

export const validation = new Validation();

export default {
  Validation,
  validation,
};
