import crypto from 'crypto';
import createHttpError from 'http-errors';
import { db } from '../db.js';

const formatTimestamp = (ts = Date.now(), withoutTimezone = false) => {
  const timestamp = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));
  if (withoutTimezone) return timestamp;
  return `${timestamp}+9`;
};

export class Service {
  async now() {
    return formatTimestamp();
  }

  async find() {
    return db.list('user')
    .then(items => items.map(item => {
      item.registerAt = item.registerAt ? formatTimestamp(item.registerAt) : '-';
      item.lastAccess = item.lastAccess ? formatTimestamp(item.lastAccess) : '-';
      item.deletedAt = item.deletedAt ? formatTimestamp(item.deletedAt) : undefined;
      item.id = item.key;
      delete item.key;
      return item;
    }));
  }

  async register(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    return db.getValue('user', login)
    .then(item => {
      if (item) throw createHttpError(400);
      const hash = crypto.createHash('sha3-256').update(`${login}/${password}`).digest('base64');
      return db.setValue('user', login, {
        deletedAt: 0,
        registerAt: formatTimestamp(),
        hash,
      });
    });
  }

  async reset(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    return db.getValue('user', login)
    .then(item => {
      if (!item) throw createHttpError(400);
      const hash = crypto.createHash('sha3-256').update(`${login}/${password}`).digest('base64');
      return db.setValue('user', login, {
        ...item,
        hash,
        deletedAt: 0,
      }, item.key).then(() => item);
    });
  }

  async remove({ key }) {
    if (!key) throw createHttpError(400);
    return db.getValue('user', key)
    .then(item => {
      if (!item) throw createHttpError(400);
      if (item.deletedAt) return db.deleteValue('user', key);
      return db.setValue('user', key, {
        ...item,
        deletedAt: formatTimestamp(),
      });
    });
  }
}

export const service = new Service();

export default { Service, service };
