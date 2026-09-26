import createHttpError from 'http-errors';
import { service as authService } from '../auth/service.js';
import { service } from './service.js';

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
      res.status(e.status).end(e.cause?.message ?? e.cause ?? e.message);
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
    .then(({ ContentType, buffer: stream }) => {
      res.setHeader('Content-Type', ContentType);
      return new Promise((resolve, reject) => {
        stream.once('error', reject);
        res.once('finish', resolve);
        stream.pipe(res);
      });
    })
    .catch(e => {
      if (!e.status) e.status = 404;
      res.status(e.status).end(e.cause?.message ?? e.cause ?? e.message);
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
      res.status(e.status).json({ message: e.cause?.message ?? e.cause ?? e.message });
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
      res.status(e.status).json({ message: e.cause?.message ?? e.cause ?? e.message });
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
      res.status(e.status).json({ message: e.cause?.message ?? e.cause ?? e.message });
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
      res.status(e.status).json({ message: e.cause?.message ?? e.cause ?? e.message });
    });
  }
}

export const controller = new Controller();
export default { Controller, controller };
