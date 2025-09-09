import createHttpError from 'http-errors';
import { service } from './service.js';
import { service as authService } from '../auth/service.js';

export class Controller {
  find(req, res) {
    const { cookies: { token } } = req;
    return authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (!login) throw createHttpError(403);
      return service.find({ login });
    })
    .then(({ images }) => {
      res.json({ images });
    })
    .catch(e => {
      if (!e.status) e.status = 500;
      res.status(e.status).end(e.message);
    });
  }

  image(req, res) {
    const { params: { type, fname }, cookies: { token } } = req;
    return authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (!login) throw createHttpError(403);
      return service.image({ login, type, fname });
    })
    .then(({ ContentType, buffer }) => {
      res.contentType(ContentType);
      buffer.pipe(res);
    })
    .then(() => new Promise(resolve => { res.on('finish', resolve); }))
    .catch(e => {
      if (!e.status) e.status = 404;
      res.status(e.status).end(e.message);
    });
  }

  upload(req, res) {
    const { files, cookies: { token } } = req;
    return authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (!login) throw createHttpError(403);
      return service.upload({ login, files });
    })
    .then(() => res.json({ ok: true }))
    .catch(e => {
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }

  remove(req, res) {
    const { body: { name }, cookies: { token } } = req;
    return authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (!login) throw createHttpError(403);
      return service.remove({ login, fname: name });
    })
    .then(() => res.json({ ok: true }))
    .catch(e => {
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }

  getData(req, res) {
    const { body: list, cookies: { token } } = req;
    return authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (!login) throw createHttpError(403);
      return service.getData({ login, list });
    })
    .then(dataset => res.json(dataset))
    .catch(e => {
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }

  putData(req, res) {
    const { body: dataset, cookies: { token } } = req;
    return authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (!login) throw createHttpError(403);
      return service.putData({ login, dataset });
    })
    .then(() => res.json({ ok: true }))
    .catch(e => {
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }
}

export const controller = new Controller();

export default {
  Controller,
  controller,
};
