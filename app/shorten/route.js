const { Router } = require('express');
const { controller } = require('./controller');

const router = Router();

router.get('', (req, res) => res.send('i am shorten'));
router.post('/register', controller.register);
router.get('/:id', controller.redirect);

module.exports = {
  route: { router },
};
