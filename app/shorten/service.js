import crypto from 'crypto';
import createHttpError from 'http-errors';
import { db } from '../db.js';

const { ENV } = process.env;
const tableName = {
  stg: 'stg-shorten',
  dev: 'shorten',
  test: 'shorten',
}[ENV];
const tableHash = {
  stg: 'stg-shorten-hash',
  dev: 'shorten-hash',
  test: 'shorten-hash',
}[ENV];

const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const headers = { 'accept-language': 'ja', 'user-agent': userAgent };

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
  return `${timestamp}+09:00`;
};

const random = (length = 7) => {
  const bytes = crypto.randomBytes(16).toString('hex');
  const num = BigInt(`0x${bytes}`);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const r = BigInt(chars.length);
  let result = '';
  let n = num;
  while (n > 0n) {
    result = `${chars[Number.parseInt(n % r, 10)]}${result}`;
    n /= r;
  }
  return result.slice(-length);
};

export class Service {
  async register(rest) {
    const { html } = rest;
    if (!html) throw createHttpError(400);
    const hash = crypto.createHash('sha256').update(html).digest('hex');
    return db.getValue(tableHash, hash)
    .then(async exist => {
      if (exist) {
        return db.getValue(tableName, exist.code)
        .then(item => ({ ...item, key: exist.code }));
      }
      const pattern = '^https://raw.githubusercontent.com/jobscale/_/main/infra/(.+)';
      const regExp = new RegExp(pattern);
      const [, key] = html.match(regExp) || [undefined, random(7)];
      const caption = await this.parseCaption(html, key);
      await db.setValue(tableHash, hash, { code: key });
      return db.setValue(tableName, key, {
        caption,
        html,
        deletedAt: 0,
        registerAt: formatTimestamp(),
        count: 0,
      });
    })
    .then(({ key: id }) => ({ id }));
  }

  async parseCaption(url, key) {
    let fallback = key;
    const html = await fetch(url, { headers }).then(res => res.text()).catch(e => { fallback = e.cause || e.message; });
    const match = html?.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = match ? match[1].trim() : fallback;
    return title;
  }

  async find() {
    return db.list(tableName)
    .then(items => items.map(item => {
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
    .then(data => {
      const lastAccess = formatTimestamp();
      return db.setValue(tableName, key, {
        ...data,
        lastAccess,
        count: (parseInt(data.count, 10) || 0) + 1,
      }).then(() => data);
    })
    .then(({ html }) => ({ html }));
  }
}

export const service = new Service();
export default { Service, service };
