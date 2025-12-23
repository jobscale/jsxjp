import Joi from 'joi';
import { login } from '../policy.js';

export class Validation {
  async register(req, res) {
    const { error } = Joi.object({
      login: Joi.string().required().pattern(login).max(30),
      password: Joi.string().required().min(6).max(30),
      role: Joi.string().required().min(2).max(20),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async reset(req, res) {
    const { error } = Joi.object({
      login: Joi.string().required().pattern(login).max(30),
      password: Joi.string().required().min(6).max(30),
      role: Joi.string().required().min(2).max(20),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

export const validation = new Validation();

export default { Validation, validation };
