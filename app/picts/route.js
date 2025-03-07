const { Router } = require('express');
const multer = require('multer');
const { controller } = require('./controller');
const { controller: authController } = require('../auth/controller');

const upload = multer();
const router = Router();
router.use('', authController.verify);
router.post('/upload', upload.array('files'), controller.upload);
router.post('/find', controller.find);
router.post('/remove', controller.remove);
router.get('/:type/:fname', controller.image);
router.post('/getData', controller.getData);
router.post('/putData', controller.putData);
router.get('', (req, res) => res.status(404).send('not found'));

module.exports = {
  route: { router },
};
