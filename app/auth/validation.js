import Joi from 'joi';
import { login, base32 } from '../policy.js';

export class Validation {
  async login(req, res) {
    const { error } = Joi.object({
      login: Joi.string().required().pattern(login).max(2 ** 5 - 1),
      password: Joi.string().required().max(2 ** 5 - 1),
      code: Joi.string(),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async totp(req, res) {
    const { error } = Joi.object({
      secret: Joi.string().required().pattern(base32).min(5).max(2 ** 12 - 1),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

export const validation = new Validation();

export default { Validation, validation };
