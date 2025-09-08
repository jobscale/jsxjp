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
      res.setCookie('href', '', {
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
    res.setCookie('token', '', {
      expires: dayjs().add(10, 'second').toDate(),
      httpOnly: true,
      secure: !!req.socket.encrypted,
    });
    res.redirect('/auth');
  }

  sign(req, res) {
    const { token } = req.cookies;
    return authService.decode(token)
    .then(payload => res.json(payload))
    .catch(e => {
      const { href } = req.body;
      res.setCookie('href', href, {
        expires: dayjs().add(5, 'minute').toDate(),
        httpOnly: true,
        secure: !!req.socket.encrypted,
      });
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
    const { token } = req.cookies;
    return authService.verify(token)
    .then(() => {
      res.setCookie('token', token, {
        expires: dayjs().add(12, 'hour').toDate(),
        httpOnly: true,
        secure: !!req.socket.encrypted,
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
