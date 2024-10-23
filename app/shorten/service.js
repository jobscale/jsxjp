const createHttpError = require('http-errors');
const dayjs = require('dayjs');
const { JSDOM } = require('jsdom');
const { db } = require('../db');

const { ENV } = process.env;
const tableName = {
  stg: 'stg-shorten',
  dev: 'shorten',
  test: 'shorten',
}[ENV || 'dev'];

const showDate = (date, defaultValue) => (date ? dayjs(date).add(9, 'hours').toISOString()
.replace(/T/, ' ')
.replace(/\..*$/, '') : defaultValue);

const random = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(
    { length: 6 },
    () => chars.charAt((Math.floor(Math.random() * 1000) + Date.now()) % chars.length),
  ).join('');
};

class Service {
  async register(rest) {
    const { html } = rest;
    if (!html) throw createHttpError(400);
    return db.findValue(tableName, `"html": "${html}"`)
    .then(async item => {
      if (item) return item;
      const pattern = '^https://raw.githubusercontent.com/jobscale/_/main/infra/(.+)';
      const regExp = new RegExp(pattern);
      const [, key] = html.match(regExp) || [undefined, random()];
      const caption = (await this.getCaption({ html })) || key;
      return db.setValue(tableName, key, {
        caption,
        html,
        deletedAt: 0,
        registerAt: new Date().toISOString(),
        count: 0,
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

  async find() {
    return db.list(tableName)
    .then(items => items.map(item => {
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
    return db.getValue(tableName, key)
    .then(data => {
      if (!data) throw createHttpError(400);
      if (data.deletedAt) return db.deleteValue(tableName, key);
      return db.setValue(tableName, key, {
        ...data,
        deletedAt: new Date().getTime(),
      });
    });
  }

  async redirect(rest) {
    const { id: key } = rest;
    return db.getValue(tableName, key)
    .then(data => {
      if (!data) throw createHttpError(400);
      if (data.deletedAt) throw createHttpError(501);
      return data;
    })
    .then(data => db.setValue(tableName, key, {
      ...data,
      lastAccess: new Date().toISOString(),
      count: (parseInt(data.count, 10) || 0) + 1,
    }).then(() => data))
    .then(({ html }) => ({ html }));
  }
}

module.exports = {
  Service,
  service: new Service(),
};
