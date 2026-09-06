import { Router } from '../router.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('POST', '/slack', [validation.slack, controller.slack]);
router.add('POST', '/email', [validation.email, controller.email]);
router.add('POST', '/webPush', [validation.webPush, controller.webPush]);
router.add('POST', '/getNumber', controller.getNumber);
router.add('POST', '/sendmail', [validation.sendmail, controller.sendmail]);
router.add('GET', '/public', controller.public);
router.add('POST', '/subscription', [validation.subscription, controller.subscription]);
router.add('POST', '/hostname', controller.hostname);
router.add('POST', '/speed', controller.speed);

export const route = { router };
export default { route };
