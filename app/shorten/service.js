const createHttpError = require('http-errors');
const dayjs = require('dayjs');
const { JSDOM } = require('jsdom');
const { connection } = require('../db');

const { ENV } = process.env;
const tableName = `${ENV || 'dev'}-shorten`;
const logger = console;

const showDate = (date, defaultValue) => (date ? dayjs(date).add(9, 'hours').toISOString()
.replace(/T/, ' ')
.replace(/\..*$/, '') : defaultValue);

class Service {
  async register(rest) {
    const { html } = rest;
    if (!html) throw createHttpError(400);
    const isOk = await fetch(html).then(res => res.status === 200).catch(e => logger.warn(e));
    if (!isOk) throw createHttpError(400);
    const db = await connection(tableName);
    return db.fetch({ html })
    .then(({ items: [item] }) => {
      if (item) return item;
      const pattern = '^https://raw.githubusercontent.com/jobscale/_/main/infra/(.+)';
      const regExp = new RegExp(pattern);
      const [, key] = html.match(regExp) || [];
      return this.getCaption({ html })
      .then(caption => {
        logger.info(caption);
        return db.put({
          key,
          caption,
          html,
          deletedAt: 0,
          registerAt: new Date().toISOString(),
          count: 0,
        });
      });
    })
    .then(({ key: id }) => ({ id }));
  }

  async getCaption({ html }) {
    return fetch(html)
    .then(res => res.text())
    .then(body => new JSDOM(body).window.document)
    .then(document => document.querySelector('title'))
    .then(title => title && title.textContent);
  }

  async find({ key }) {
    const db = await connection(tableName);
    return db.fetch({ key })
    .then(({ items }) => items.map(item => {
      item.registerAt = showDate(item.registerAt, '-');
      item.lastAccess = showDate(item.lastAccess, '-');
      item.deletedAt = showDate(item.deletedAt);
      item.id = item.key;
      delete item.key;
      return item;
    }));
  }

  async remove({ key }) {
    if (!key) throw createHttpError(400);
    const db = await connection(tableName);
    return db.get(key)
    .then(data => {
      if (!data) throw createHttpError(400);
      return data;
    })
    .then(data => db.update({
      deletedAt: new Date().getTime(),
    }, data.key));
  }

  async redirect(rest) {
    const { id: key } = rest;
    const db = await connection(tableName);
    return db.get(key)
    .then(data => {
      if (!data) throw createHttpError(400);
      if (data.deletedAt) throw createHttpError(501);
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
