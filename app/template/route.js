const { Router } = require('express');
const { controller: templateController } = require('./controller');

const router = Router();
router.post('', templateController.load);

module.exports = {
  route: { router },
};
