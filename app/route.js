import { Router } from './router.js';
import { route as ipRoute } from './ip/route.js';
import { route as apiRoute } from './api/route.js';
import { route as authRoute } from './auth/route.js';
import { route as accountRoute } from './account/route.js';
import { route as userRoute } from './user/route.js';
import { route as templateRoute } from './template/route.js';
import { route as shortenRoute } from './shorten/route.js';
import { route as planPulse } from './plan-pulse/route.js';
import { route as picts } from './picts/route.js';
import { controller } from './controller.js';

const router = new Router();
router.use('/ip', ipRoute.router);
router.use('/api', apiRoute.router);
router.use('/picts', picts.router);
router.use('/plan-pulse', planPulse.router);
router.use('/s', shortenRoute.router);
router.use('', authRoute.router);
router.use('/account', accountRoute.router);
router.use('/user', userRoute.router);
router.use('/template', templateRoute.router);
router.add('GET', '', controller.page);

export const route = { router };

export default { route };
