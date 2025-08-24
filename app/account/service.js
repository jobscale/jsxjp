import createHttpError from 'http-errors';
import { auth } from '../auth/index.js';
import { createHash } from '../user/index.js';
import { connection } from '../db.js';

const { ENV } = process.env;
const tableName = {
  stg: 'stg-user',
  dev: 'user',
  test: 'user',
}[ENV];

export class Service {
  async password(rest) {
    const { password, token } = rest;
    if (!token || !password) throw createHttpError(400);
    const { login } = auth.decode(token);
    if (!login) throw createHttpError(400);
    const db = await connection(tableName);
    return db.fetch({
      login, deletedAt: 0,
    })
    .then(({ items: [item] }) => {
      if (!item) throw createHttpError(400);
      return db.update({
        hash: createHash(`${login}/${password}`),
      }, item.key).then(() => item);
    });
  }
}

export const service = new Service();

export default {
  Service,
  service,
};
