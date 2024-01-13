const { Router } = require('express');
const multer = require('multer');
const { controller } = require('./controller');
const { controller: authController } = require('../auth/controller');

const upload = multer();
const router = Router();

router.use('', (...args) => authController.verify(...args));
router.post('/upload', upload.array('files'), controller.upload);
router.post('/find', controller.find);
router.post('/remove', controller.remove);
router.get('/:type/:fname', controller.image);
router.get('', (req, res) => res.status(404).send('not found'));

module.exports = {
  route: { router },
};
