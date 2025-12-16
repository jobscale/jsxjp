import { Router } from '../router.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('OPTIONS', '/slack', (req, res) => res.end());
router.add('POST', '/slack', [
  await validation.slack,
  controller.slack,
]);
router.add('POST', '/email', [
  validation.email,
  controller.email,
]);
router.add('POST', '/getNumber', controller.getNumber);
router.add('POST', '/sendmail', [
  await validation.sendmail,
  controller.sendmail,
]);
router.add('GET', '/public', controller.public);
router.add('POST', '/subscription', [
  validation.subscription,
  controller.subscription,
]);
router.add('POST', '/hostname', controller.hostname);

export const route = { router };
export default {
  route: { router },
};
