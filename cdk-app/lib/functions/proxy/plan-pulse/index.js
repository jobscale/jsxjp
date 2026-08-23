import createHttpError from 'http-errors';
import { validation } from '../../../../app/plan-pulse/validation.js';
import { service } from '../../../../app/plan-pulse/service.js';

const validate = async (method, req, res) => {
  await validation[method](req, res);
  if (res.writableEnded) {
    throw createHttpError(res.statusCode, res.body.message);
  }
};

export class PlanPulse {
  async hub(req, res) {
    await validate('hub', req, res);
    const result = await service.hub({ hubId: req.body.hubId });
    res.json(result);
  }

  async putHub(req, res) {
    await validate('putHub', req, res);
    const { hubId, hub } = req.body;
    const result = await service.putHub({ hubId, hub });
    res.json(result);
  }

  async putPerson(req, res) {
    await validate('putPerson', req, res);
    const { hubId, personId, person } = req.body;
    const result = await service.putPerson({ hubId, personId, person });
    res.json(result);
  }

  async removePerson(req, res) {
    await validate('removePerson', req, res);
    const { hubId, personId } = req.body;
    const result = await service.removePerson({ hubId, personId });
    res.json(result);
  }
}

export const planPulse = new PlanPulse();
