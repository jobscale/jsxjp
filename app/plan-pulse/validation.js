import Joi from 'joi';

export class Validation {
  async hub(req, res) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async putHub(req, res) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
      hub: Joi.object().required(),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async putPerson(req, res) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
      personId: Joi.string().required().alphanum().max(30),
      person: Joi.object().required(),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async removePerson(req, res) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
      personId: Joi.string().required().alphanum().max(30),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

export const validation = new Validation();

export default { Validation, validation };
