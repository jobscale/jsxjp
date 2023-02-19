const { Router } = require('express');
const { controller: templateController } = require('./controller');

const router = Router();

router.post('', (...args) => templateController.load(...args));

module.exports = {
  route: { router },
};
