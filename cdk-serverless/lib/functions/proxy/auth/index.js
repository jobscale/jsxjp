import createHttpError from 'http-errors';
import { validation } from '../../../../app/auth/validation.js';
import { service } from '../../../../app/auth/service.js';

export class Auth {
  async login(req, res) {
    await validation.login(req, res);
    if (res.writableEnded) {
      throw createHttpError(res.statusCode, res.body.message);
    }
    const result = await service.login(req.body);
    res.setCookie('token', result.token, {
      expires: new Date(Date.now() + 60 * 60 * 1000),
    });
    return result;
  }

  async totp(req, res) {
    await validation.totp(req, res);
    if (res.writableEnded) {
      throw createHttpError(res.statusCode, res.body.message);
    }
    return service.totp(req.body);
  }

  async sign(req, res, head = false) {
    const setHeader = (user = {}) => {
      res.setHeader('X-User', user.login ?? 'Guest');
      res.setHeader('X-Address', req.headers.get('x-forwarded-for')?.split(' ')[0] || req.requestContext.http.sourceIp);
    };
    const token = req.cookies?.token;
    const result = await service.decode(token);
    res.setCookie('token', token, {
      expires: new Date(Date.now() + 60 * 60 * 1000),
    });
    setHeader(result);
    return head ? undefined : result;
  }
}

export const auth = new Auth();
