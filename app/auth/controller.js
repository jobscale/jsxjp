import dayjs from 'dayjs';
import createHttpError from 'http-errors';
import { logger } from '@jobscale/logger';
import { service as authService } from './service.js';
import { service as apiService } from '../api/service.js';

export class Controller {
  login(req, res) {
    const { login, password, code } = req.body;
    return authService.login({ login, password, code })
    .then(({ token, multiFactor }) => {
      if (code || login.startsWith('orange')) {
        res.setCookie('token', token, {
          expires: dayjs().add(1, 'hour'),
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
      const { cookies: { redirectTo } } = req;
      res.clearCookie('redirectTo');
      const ignore = [
        '/auth', '/account/password', '/favicon.ico', '', undefined,
      ];
      res.json({ href: ignore.indexOf(redirectTo) === -1 ? redirectTo : '/' });
    })
    .catch(e => {
      logger.info({ message: e });
      if (!e.status) e.status = 401;
      res.status(e.status).json({ message: e.name });
    });
  }

  logout(req, res) {
    res.clearCookie('token');
    res.redirect('/auth');
  }

  sign(req, res) {
    const { cookies: { token } } = req;
    return authService.decode(token)
    .then(payload => {
      res.setCookie('token', token, {
        expires: dayjs().add(1, 'hour'),
      });
      return payload;
    })
    .then(payload => {
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      res.json(payload);
    })
    .catch(e => {
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      const { href } = req.body;
      if (href) {
        res.setCookie('redirectTo', href, {
          expires: dayjs().add(5, 'minute'),
        });
      }
      res.status(403).json({ message: e.message });
    });
  }

  totp(req, res) {
    const { secret } = req.body;
    return authService.totp({ secret })
    .then(result => res.json(result))
    .catch(e => {
      if (!e.statusCode) e = createHttpError(403);
      res.status(e.statusCode || 500).json({ message: e.message });
    });
  }

  verify(req, res, next) {
    const { cookies: { token } } = req;
    return authService.verify(token)
    .then(() => {
      res.setCookie('token', token, {
        expires: dayjs().add(1, 'hour'),
      });
    })
    .then(() => next(req, res))
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

export const controller = new Controller();

export default {
  Controller,
  controller,
};
