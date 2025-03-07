const { Router } = require('express');
const { controller: accountController } = require('./controller');
const { validation: accountValidation } = require('./validation');

const router = Router();
router.post(
  '/password',
  accountValidation.password,
  accountController.password,
);

module.exports = {
  route: { router },
};
