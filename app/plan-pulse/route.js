const { Router } = require('express');
const { controller } = require('./controller');
const { validation } = require('./validation');

const router = Router();

router.post(
  '/hub',
  (...args) => validation.hub(...args),
  (...args) => controller.hub(...args),
);
router.post(
  '/putHub',
  (...args) => validation.putHub(...args),
  (...args) => controller.putHub(...args),
);
router.post(
  '/putPerson',
  (...args) => validation.putPerson(...args),
  (...args) => controller.putPerson(...args),
);
router.post(
  '/removePerson',
  (...args) => validation.removePerson(...args),
  (...args) => controller.removePerson(...args),
);

module.exports = {
  route: { router },
};
