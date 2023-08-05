const createHttpError = require('http-errors');
const dayjs = require('dayjs');
const { connection } = require('../db');

const showDate = (date, defaultValue) => (date ? dayjs(date).add(9, 'hours').toISOString()
.replace(/T/, ' ')
.replace(/\..*$/, '') : defaultValue);

class Service {
  async register(rest) {
    const { html } = rest;
    if (!html) throw createHttpError(400);
    const db = await connection();
    return db.fetch({ html })
    .then(({ items: [item] }) => {
      if (item) return item;
      const pattern = '^https://raw.githubusercontent.com/jobscale/_/main/infra/(.+)';
      const regExp = new RegExp(pattern);
      const [, key] = html.match(regExp) || [];
      return db.put({
        key,
        html,
        deletedAt: 0,
        registerAt: new Date().toISOString(),
        count: 0,
      });
    })
    .then(({ key: id }) => ({ id }));
  }

  async find({ id: key }) {
    const db = await connection();
    return db.fetch({ key })
    .then(({ items }) => items
    .map(item => {
      item.registerAt = showDate(item.registerAt, '-');
      item.lastAccess = showDate(item.lastAccess, '-');
      item.deletedAt = showDate(item.deletedAt);
      item.id = item.key;
      delete item.key;
      return item;
    }));
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
}

module.exports = {
  Service,
  service: new Service(),
};
