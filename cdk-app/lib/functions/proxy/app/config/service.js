import createHttpError from 'http-errors';
import { decode } from '../js-proxy.js';
import { db } from '../db.js';
import { formatTimestamp } from '../timestamp.js';

export class Service {
  getTableName() {
    const env = process.env.ENV;
    return {
      stg: 'stg-config',
      dev: 'config',
      test: 'config',
    }[env];
  }

  async register(rest) {
    const { name, data } = rest;
    if (!name || !data) throw createHttpError(400);
    return db.setValue(this.getTableName(), name, {
      name,
      data,
      registerAt: formatTimestamp(),
    });
  }

  async findOne({ name }) {
    if (!name) throw createHttpError(400);
    return db.getValue(this.getTableName(), name);
  }

  async remove({ key }) {
    if (!key) throw createHttpError(400);
    return db.deleteValue(this.getTableName(), key);
  }

  async getEnv(name) {
    const { data } = await this.findOne({ name });
    return JSON.parse(decode(data));
  }
}

export const service = new Service();
export default { Service, service };
