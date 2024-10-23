const createHttpError = require('http-errors');
const { decode } = require('../js-proxy');
const { db } = require('../db');

const { ENV } = process.env;
const tableName = {
  stg: 'stg-config',
  dev: 'config',
  test: 'config',
}[ENV];

class Service {
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

module.exports = {
  Service,
  service: new Service(),
};
