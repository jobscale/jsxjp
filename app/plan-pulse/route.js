const { Router } = require('express');
const { controller } = require('./controller');
const { validation } = require('./validation');

const router = Router();
router.post(
  '/hub',
  validation.hub,
  controller.hub,
);
router.post(
  '/putHub',
  validation.putHub,
  controller.putHub,
);
router.post(
  '/putPerson',
  validation.putPerson,
  controller.putPerson,
);
router.post(
  '/removePerson',
  validation.removePerson,
  controller.removePerson,
);

module.exports = {
  route: { router },
};
