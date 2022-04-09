const dayjs = require('dayjs');
const { authService } = require('./service');
const { Controller } = require('../controller');

class AuthController extends Controller {
  index(req, res) {
    authService.now()
    .then((now) => {
      res.render('auth/login', { title: 'Login', now });
    });
  }

  login(req, res) {
    const { login, password } = req.body;
    authService.login({ login, password })
    .then(token => {
      this.cookie(res, 'token', token, dayjs().add(12, 'hour'));
      const { href } = req.cookies;
      this.cookie(res, 'href', '', dayjs().add(10, 'second'));
      const ignore = [undefined, '/auth', '/favicon.ico', ''];
      res.json({ href: ignore.indexOf(href) === -1 ? href : '/' });
    })
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 401;
      res.status(e.status).json({ message: e.message });
    });
  }

  logout(req, res) {
    this.cookie(res, 'token', '', dayjs().add(10, 'second'));
    res.end();
  }

  verify(req, res, next) {
    const { token } = req.cookies;
    authService.verify(token)
    .then(() => next())
    .catch(e => {
      logger.info({ message: e.toString() });
      this.cookie(res, 'href', req.originalUrl, dayjs().add(5, 'minute'));
      res.redirect('/auth');
    });
  }
}

module.exports = {
  AuthController,
  authController: new AuthController(),
};
