import { logger } from '@jobscale/logger';
import { service } from './service.js';

export class Controller {
  hub(req, res) {
    const { hubId } = req.body;
    service.hub({ hubId })
    .then(result => {
      res.json(result);
    })
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.message });
    });
  }

  putHub(req, res) {
    const { hubId, hub } = req.body;
    service.putHub({ hubId, hub })
    .then(result => {
      res.json(result);
    })
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.message });
    });
  }

  putPerson(req, res) {
    const { hubId, personId, person } = req.body;
    service.putPerson({ hubId, personId, person })
    .then(result => {
      res.json(result);
    })
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.message });
    });
  }

  removePerson(req, res) {
    const { hubId, personId } = req.body;
    service.removePerson({ hubId, personId })
    .then(result => {
      res.json(result);
    })
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.message });
    });
  }
}

export const controller = new Controller();

export default {
  Controller,
  controller,
};
