import Joi from 'joi';

export class Validation {
  async load(req, res) {
    const { error } = Joi.object({
      id: Joi.string().pattern(/^\w+(?:-\w+)*$/).min(5).max(2 ** 12 - 1),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

export const validation = new Validation();
export default { Validation, validation };
