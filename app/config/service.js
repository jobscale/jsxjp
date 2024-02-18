const createHttpError = require('http-errors');
const { decode } = require('../js-proxy');
const { connection } = require('../db');

const { ENV } = process.env;
const tableName = {
  dev: 'dev-config',
  test: 'dev-config',
}[ENV || 'dev'];

class Service {
  async register(rest) {
    const { name, data } = rest;
    if (!name || !data) throw createHttpError(400);
    const db = await connection(tableName);
    return db.fetch({ name })
    .then(({ items: [item] }) => db[item ? 'update' : 'put']({
      name,
      data,
      deletedAt: 0,
      registerAt: new Date().toISOString(),
    }, item && item.key));
  }

  async findOne({ name }) {
    if (!name) throw createHttpError(400);
    const db = await connection(tableName);
    return db.fetch({ name })
    .then(({ items: [item] }) => item);
  }

  async remove({ key }) {
    if (!key) throw createHttpError(400);
    const db = await connection(tableName);
    return db.delete(key);
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
