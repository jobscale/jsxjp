const dayjs = require('dayjs');
const { logger } = require('@jobscale/logger');
const { service: authService } = require('./service');
const { service: apiService } = require('../api/service');

class Controller {
  login(req, res) {
    const { login, password, code } = req.body;
    authService.login({ login, password, code })
    .then(({ token, multiFactor }) => {
      if (code) {
        this.cookie(res, 'token', token, dayjs().add(12, 'hour'));
      } else if (multiFactor) {
        apiService.slack({
          icon_emoji: ':unlock:',
          username: 'Multi Factor Login',
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
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 401;
      res.status(e.status).json({ message: e.message });
    });
  }

  logout(req, res) {
    this.cookie(res, 'token', '', dayjs().add(10, 'second'));
    res.redirect('/auth');
  }

  sign(req, res) {
    const { token } = req.cookies;
    authService.verify(token)
    .then(() => res.json({ ok: true }))
    .catch(e => {
      const { href } = req.body;
      this.cookie(res, 'href', href, dayjs().add(5, 'minute'));
      res.status(403).json({ message: e.message });
    });
  }

  totp(req, res) {
    const { secret } = req.body;
    authService.totp({ secret })
    .then(({ code }) => res.json({ code }))
    .catch(e => {
      res.status(403).json({ message: 'Access Deny' });
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
