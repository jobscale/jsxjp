import { Router } from '../router.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('OPTIONS', '/slack', (req, res) => res.end());
router.add('POST', '/slack', async (req, res) => {
  await validation.slack(req, res, controller.slack);
});
router.add('POST', '/email', async (req, res) => {
  await validation.email(req, res, controller.email);
});
router.add('POST', '/getNumber', controller.getNumber);
router.add('POST', '/sendmail', async (req, res) => {
  await validation.sendmail(req, res, controller.sendmail);
});
router.add('GET', '/public', controller.public);
router.add('POST', '/subscription', async (req, res) => {
  await validation.subscription(req, res, controller.subscription);
});
router.add('POST', '/hostname', controller.hostname);

export const route = { router };
export default {
  route: { router },
};
