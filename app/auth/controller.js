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
        res.cookie('token', token, {
          expires: dayjs().add(12, 'hour').toDate(),
          httpOnly: true,
          secure: !!req.socket.encrypted,
        });
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
      res.cookie('href', '', {
        expires: dayjs().add(10, 'second').toDate(),
        httpOnly: true,
        secure: !!req.socket.encrypted,
      });
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
    res.cookie('token', '', {
      expires: dayjs().add(10, 'second').toDate(),
      httpOnly: true,
      secure: !!req.socket.encrypted,
    });
    res.redirect('/auth');
  }

  sign(req, res) {
    const { token } = req.cookies;
    authService.decode(token)
    .then(payload => res.json(payload))
    .catch(e => {
      const { href } = req.body;
      res.cookie('href', href, {
        expires: dayjs().add(5, 'minute').toDate(),
        httpOnly: true,
        secure: !!req.socket.encrypted,
      });
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
    .then(() => {
      res.cookie('token', token, {
        expires: dayjs().add(12, 'hour').toDate(),
        httpOnly: true,
        secure: !!req.socket.encrypted,
      });
      next();
    })
    .catch(e => {
      logger.info({ ...e });
      if (req.method === 'GET') {
        res.redirect('/auth');
        return;
      }
      res.status(403).json({ message: 'access denied' });
    });
  }
}

module.exports = {
  Controller,
  controller: new Controller(),
};
