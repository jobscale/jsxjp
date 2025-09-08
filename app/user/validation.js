import Joi from 'joi';
import { login } from '../policy.js';

export class Validation {
  async register(req, res, next) {
    const { error } = Joi.object({
      login: Joi.string().pattern(login).max(30),
      password: Joi.string().min(6).max(30),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    await next(req, res);
  }

  async reset(req, res, next) {
    const { error } = Joi.object({
      login: Joi.string().pattern(login).max(30),
      password: Joi.string().min(6).max(30),
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
