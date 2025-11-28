import { Router } from '../router.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('POST', '/hub', async (req, res) => {
  await validation.hub(req, res, controller.hub);
});
router.add('POST', '/putHub', async (req, res) => {
  await validation.putHub(req, res, controller.putHub);
});
router.add('POST', '/putPerson', async (req, res) => {
  await validation.putPerson(req, res, controller.putPerson);
});
router.add('POST', '/removePerson', async (req, res) => {
  await validation.removePerson(req, res, controller.removePerson);
});

export const route = { router };

export default { route };
