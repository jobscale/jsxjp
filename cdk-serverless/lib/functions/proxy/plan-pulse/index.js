import createHttpError from 'http-errors';
import { validation } from '../../../../../app/plan-pulse/validation.js';
import { service } from '../../../../../app/plan-pulse/service.js';

const validate = async (method, req, res) => {
  await validation[method](req, res);
  if (res.writableEnded) {
    throw createHttpError(res.statusCode, res.body.message);
  }
};

export class PlanPulse {
  async hub(req, res) {
    await validate('hub', req, res);
    return service.hub({ hubId: req.body.hubId });
  }

  async putHub(req, res) {
    await validate('putHub', req, res);
    const { hubId, hub } = req.body;
    return service.putHub({ hubId, hub });
  }

  async putPerson(req, res) {
    await validate('putPerson', req, res);
    const { hubId, personId, person } = req.body;
    return service.putPerson({ hubId, personId, person });
  }

  async removePerson(req, res) {
    await validate('removePerson', req, res);
    const { hubId, personId } = req.body;
    return service.removePerson({ hubId, personId });
  }
}

export const planPulse = new PlanPulse();
