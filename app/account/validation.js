import Joi from 'joi';

export class Validation {
  password(req, res, next) {
    const { error } = Joi.object({
      password: Joi.string().min(6).max(30),
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
