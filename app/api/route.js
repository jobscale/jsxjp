const { Router } = require('express');
const { controller: apiController } = require('./controller');
const { validation: apiValidation } = require('./validation');

const router = Router();
router.post(
  '/slack',
  apiValidation.slack,
  apiController.slack,
);
router.post(
  '/email',
  apiValidation.email,
  apiController.email,
);
router.post(
  '/hostname',
  apiController.hostname,
);

module.exports = {
  route: { router },
};
