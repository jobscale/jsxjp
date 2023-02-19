const { logger } = require('@jobscale/logger');
const { service: apiService } = require('./service');

class Controller {
  slack(req, res) {
    const { body } = req;
    apiService.slack(body)
    .then(result => res.json(result))
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }

  hostname(req, res) {
    apiService.hostname()
    .then(result => res.json(result))
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }
}

module.exports = {
  Controller,
  controller: new Controller(),
};
