const { Route } = require('./route');
const { userController } = require('../controllers/userController');
const { userValidation } = require('../validations/userValidation');

class UserRoute extends Route {
  constructor() {
    super();
    this.get('', userController.page);
    this.get('/register', userController.page);
    this.post('/register', userValidation.register, userController.register);
    this.get('/reset', userController.page);
    this.post('/reset', userValidation.reset, userController.reset);
  }
}

module.exports = {
  UserRoute,
  userRoute: new UserRoute(),
};
