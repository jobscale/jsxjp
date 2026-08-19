import createHttpError from 'http-errors';
import dayjs from 'dayjs';
import { validation } from '../../../../app/auth/validation.js';
import { service } from '../../../../app/auth/service.js';
import { service as apiService } from '../../../../app/api/service.js';

export class Auth {
  async login(req, res) {
    await validation.login(req, res);
    if (res.writableEnded) {
      throw createHttpError(res.statusCode, res.body.message);
    }
    const { login, password, code } = req.body;
    const { token, multiFactor } = await service.login({ login, password, code });
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
    const { redirectTo } = req.cookies;
    res.clearCookie('redirectTo');
    const ignore = ['/auth', '/account/password', '/favicon.ico', '', undefined];
    res.json({ href: ignore.indexOf(redirectTo) === -1 ? redirectTo : '/' });
  }

  async totp(req, res) {
    await validation.totp(req, res);
    if (res.writableEnded) {
      throw createHttpError(res.statusCode, res.body.message);
    }
    const result = await service.totp(req.body);
    res.json(result);
  }

  sign(req, res) {
    const setHeader = (user = {}) => {
      res.setHeader('X-User', user.login ?? 'Guest');
      res.setHeader('X-Address', req.headers.get('x-forwarded-for')?.split(' ')[0] || req.requestContext.http.sourceIp);
    };
    const { http: { method: httpMethod } } = req.requestContext;
    const head = httpMethod === 'HEAD';
    const token = req.cookies?.token;
    return service.decode(token)
    .then(result => {
      res.setCookie('token', token, {
        expires: dayjs().add(1, 'hour'),
      });
      if (head) {
        setHeader(result);
        res.end();
        return;
      }
      res.json(result);
    })
    .catch(e => {
      if (head) {
        setHeader();
        res.end();
        return;
      }
      const { href } = req.body || {};
      if (href) {
        res.setCookie('redirectTo', href, {
          expires: dayjs().add(5, 'minute'),
        });
      }
      res.status(403).json({ message: e.message });
    });
  }
}

export const auth = new Auth();
