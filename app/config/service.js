import createHttpError from 'http-errors';
import { decode } from '../js-proxy.js';
import { db } from '../db.js';

const { ENV } = process.env;
const tableName = {
  stg: 'stg-config',
  dev: 'config',
  test: 'config',
}[ENV];

export class Service {
  async register(rest) {
    const { name, data } = rest;
    if (!name || !data) throw createHttpError(400);
    return db.setValue(tableName, name, {
      name,
      data,
      registerAt: new Date().toISOString(),
    });
  }

  async findOne({ name }) {
    if (!name) throw createHttpError(400);
    return db.getValue(tableName, name);
  }

  async remove({ key }) {
    if (!key) throw createHttpError(400);
    return db.deleteValue(tableName, key);
  }

  async getEnv(name) {
    const { data } = await this.findOne({ name });
    return JSON.parse(decode(data));
  }
}

export const service = new Service();

export default {
  Service,
  service,
};
