const { Router } = require('express');
const { controller } = require('./controller');

const router = Router();
router.use('', controller.ip);

module.exports = {
  route: { router },
};
