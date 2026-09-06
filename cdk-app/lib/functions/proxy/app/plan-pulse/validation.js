import Joi from 'joi';

export class Validation {
  hub(req, res) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }

  putHub(req, res) {
    const { error } = Joi.object({
      hubId: Joi.string().alphanum().max(30),
      hub: Joi.object().required(),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }

  putPerson(req, res) {
    const { error } = Joi.object({
      hubId: Joi.string().required().alphanum().max(30),
      personId: Joi.string().alphanum().max(30),
      person: Joi.object().required(),
    }).validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
    }
  }

  removePerson(req, res) {
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
