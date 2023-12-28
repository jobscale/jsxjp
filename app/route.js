const { Router } = require('express');
const { route: ipRoute } = require('./ip/route');
const { route: apiRoute } = require('./api/route');
const { route: authRoute } = require('./auth/route');
const { route: accountRoute } = require('./account/route');
const { route: userRoute } = require('./user/route');
const { route: templateRoute } = require('./template/route');
const { route: shortenRoute } = require('./shorten/route');
const { route: planPulse } = require('./plan-pulse/route');
const { controller } = require('./controller');

const router = Router();
router.use(
  '/ip',
  (...args) => ipRoute.router(...args),
);
router.use(
  '/api',
  (...args) => apiRoute.router(...args),
);
router.use(
  '/plan-pulse',
  (...args) => planPulse.router(...args),
);
router.use(
  '/s',
  (...args) => shortenRoute.router(...args),
);
router.use(
  '',
  (...args) => authRoute.router(...args),
);
router.use(
  '/account',
  (...args) => accountRoute.router(...args),
);
router.use(
  '/user',
  (...args) => userRoute.router(...args),
);
router.use(
  '/template',
  (...args) => templateRoute.router(...args),
);
router.get(
  '',
  (...args) => controller.page(...args),
);

module.exports = {
  route: { router },
};
