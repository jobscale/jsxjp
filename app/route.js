const { Router } = require('express');
const { route: ipRoute } = require('./ip/route');
const { route: apiRoute } = require('./api/route');
const { route: authRoute } = require('./auth/route');
const { route: accountRoute } = require('./account/route');
const { route: userRoute } = require('./user/route');
const { route: templateRoute } = require('./template/route');
const { route: shortenRoute } = require('./shorten/route');
const { route: planPulse } = require('./plan-pulse/route');
const { route: picts } = require('./picts/route');
const { controller } = require('./controller');

const router = Router();
router.use('/ip', ipRoute.router);
router.use('/api', apiRoute.router);
router.use('/picts', picts.router);
router.use('/plan-pulse', planPulse.router);
router.use('/s', shortenRoute.router);
router.use('', authRoute.router);
router.use('/account', accountRoute.router);
router.use('/user', userRoute.router);
router.use('/template', templateRoute.router);
router.get('', controller.page);

module.exports = {
  route: { router },
};
