const dayjs = require('dayjs');
const createHttpError = require('http-errors');
const { logger } = require('@jobscale/logger');
const { service: authService } = require('./service');
const { service: apiService } = require('../api/service');

class Controller {
  login(req, res) {
    const { login, password, code } = req.body;
    authService.login({ login, password, code })
    .then(({ token, multiFactor }) => {
      if (code || login.startsWith('orange')) {
        this.cookie(res, 'token', token, dayjs().add(12, 'hour'));
      } else if (multiFactor) {
        apiService.slack({
          icon_emoji: ':unlock:',
          username: 'Multi Factor Auth Code',
          text: multiFactor,
        });
        res.json({});
        return;
      }
      const { href } = req.cookies;
      this.cookie(res, 'href', '', dayjs().add(10, 'second'));
      const ignore = [
        '/auth', '/account/password', '/favicon.ico', '', undefined,
      ];
      res.json({ href: ignore.indexOf(href) === -1 ? href : '/' });
    })
    .catch(e => {
      logger.info({ message: e });
      if (!e.status) e.status = 401;
      res.status(e.status).json({ message: e.name });
    });
  }

  logout(req, res) {
    this.cookie(res, 'token', '', dayjs().add(10, 'second'));
    res.redirect('/auth');
  }

  sign(req, res) {
    const { token } = req.cookies;
    authService.decode(token)
    .then(payload => res.json(payload))
    .catch(e => {
      const { href } = req.body;
      this.cookie(res, 'href', href, dayjs().add(5, 'minute'));
      res.status(403).json({ message: e.message });
    });
  }

  totp(req, res) {
    const { secret } = req.body;
    authService.totp({ secret })
    .then(result => res.json(result))
    .catch(e => {
      if (!e.statusCode) e = createHttpError(403);
      res.status(e.statusCode || 500).json({ message: e.message });
    });
  }

  verify(req, res, next) {
    const { token } = req.cookies;
    authService.verify(token)
    .then(() => next())
    .catch(e => {
      logger.info({ message: e.toString() });
      res.redirect('/auth');
    });
  }

  cookie(res, key, value, expires) {
    res.cookie(key, value, {
      expires: new Date(expires),
      httpOnly: true,
      secure: true,
    });
  }
}

module.exports = {
  Controller,
  controller: new Controller(),
};
