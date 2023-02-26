const createHttpError = require('http-errors');
const { connection } = require('../db');

class Service {
  async register(rest) {
    const { html } = rest;
    if (!html) throw createHttpError(400);
    const db = await connection();
    return db.fetch({ html })
    .then(({ items: [item] }) => {
      if (item) return item;
      return db.put({
        html,
        deletedAt: '',
        registerAt: new Date().toISOString(),
        count: 0,
      });
    })
    .then(({ key: id }) => ({ id }));
  }

  async redirect(rest) {
    const { id: key } = rest;
    const db = await connection();
    return db.get(key)
    .then(data => {
      if (!data) throw createHttpError(400);
      if (data.deletedAt) throw createHttpError(403);
      return data;
    })
    .then(data => db.update({
      lastAccess: new Date().toISOString(),
      count: (parseInt(data.count, 10) || 0) + 1,
    }, data.key).then(() => data))
    .then(({ html }) => ({ html }));
  }

  async remove(rest) {
    const { id: key } = rest;
    const db = await connection();
    return db.get(key)
    .then(data => {
      if (!data) throw createHttpError(400);
      return data;
    })
    .then(data => db.update({
      deletedAt: new Date().toISOString(),
    }, data.key));
  }
}

module.exports = {
  Service,
  service: new Service(),
};
