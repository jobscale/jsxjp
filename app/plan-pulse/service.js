import crypto from 'crypto';
import createHttpError from 'http-errors';
import { db } from '../s3.js';

const { ENV } = process.env;
const { tableName } = {
  stg: {
    tableName: 'stg-plan-pulse',
  },
  dev: {
    tableName: 'plan-pulse',
  },
  test: {
    tableName: 'plan-pulse',
  },
}[ENV];

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

const formatTimestamp = ts => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(ts ? new Date(ts) : new Date());

export class Service {
  async putHub({ hubId, hub }) {
    if (hubId && !await db.getValue(tableName, hubId)) throw createHttpError(400);
    hubId = random(12);
    const { key } = await db.setValue(tableName, hubId, hub);
    return { hubId: key };
  }

  async putPerson({ hubId, personId, person }) {
    const record = await db.getValue(tableName, hubId);
    if (!record) throw createHttpError(404);
    const personTable = `${tableName}/${hubId}`;
    if (!personId) {
      personId = random(8);
      person.createdAt = formatTimestamp();
    } else {
      const exist = await db.getValue(personTable, personId);
      if (!exist) throw createHttpError(400);
      person = { ...exist, ...person };
    }
    const { key } = await db.setValue(personTable, personId, person);
    return { personId: key };
  }

  async hub({ hubId }) {
    const item = await db.getValue(tableName, hubId);
    if (!item) throw createHttpError(404);
    const personTable = `${tableName}/${hubId}`;
    const persons = await db.list(personTable);
    return {
      hubId,
      hub: item,
      persons: persons.map(v => ({
        ...v, personId: v.key,
      })),
    };
  }

  async removePerson({ hubId, personId }) {
    const record = await db.getValue(tableName, hubId);
    if (!record) throw createHttpError(404);
    const personTable = `${tableName}/${hubId}`;
    if (!await db.getValue(personTable, personId)) throw createHttpError(400);
    await db.deleteValue(personTable, personId);
    return {};
  }
}

export const service = new Service();
export default { Service, service };
