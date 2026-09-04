import { describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import { Router } from '../app/router.js';

function routerApp(router) {
  return (req, res) => {
    router.handle(req, res);
  };
}

describe('Router.use', () => {
  it('runs GET, POST, and HEAD handlers for paths under the prefix', async () => {
    const router = new Router();
    const middleware = jest.fn((req, res, next) => next?.());
    const handler = jest.fn((req, res) => res.end('ok'));
    router.use('/api', middleware);
    router.add('GET', '/api/items', handler);
    router.add('POST', '/api/items', handler);
    router.add('HEAD', '/api/items', handler);

    for (const method of ['GET', 'POST', 'HEAD']) {
      await request(routerApp(router))[method.toLowerCase()]('/api/items');
    }

    expect(middleware).toHaveBeenCalledTimes(3);
  });

  it('does not treat a similar path as a prefix match', async () => {
    const router = new Router();
    const middleware = jest.fn((req, res) => res.end('middleware'));
    router.use('/api', middleware);
    const response = {
      writableEnded: false,
      end() {
        this.writableEnded = true;
      },
    };

    await router.handle({ method: 'GET', url: '/apix/items', headers: {} }, response);

    expect(middleware).not.toHaveBeenCalled();
  });
});
