import createHttpError from 'http-errors';
import { validation } from '../../../../app/template/validation.js';
import { service } from '../../../../app/template/service.js';

export class Template {
  async load(req, res) {
    await validation.load(req, res);
    if (res.writableEnded) {
      throw createHttpError(res.statusCode, res.body.message);
    }
    res.headers.set('Content-Type', 'text/html; charset=utf-8');
    return service.load(req.body.id);
  }
}

export const template = new Template();
