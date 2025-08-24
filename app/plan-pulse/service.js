import createHttpError from 'http-errors';
import { connection } from '../db.js';

const { ENV } = process.env;
const { hubTable, personTable } = {
  stg: {
    hubTable: 'stg-pp-hub',
    personTable: 'stg-pp-person',
  },
  dev: {
    hubTable: 'pp-hub',
    personTable: 'pp-person',
  },
  test: {
    hubTable: 'pp-hub',
    personTable: 'pp-person',
  },
}[ENV];

export class Service {
  async hub({ hubId }) {
    const hubDb = await connection(hubTable);
    const personDb = await connection(personTable);
    const item = await hubDb.get(hubId);
    if (!item) throw createHttpError(404);
    const data = await personDb.fetch({ hubId });
    return {
      hubId: item.key,
      hub: item.hub,
      persons: data.items.map(v => ({
        personId: v.key,
        ...v.person,
      })),
    };
  }

  async putHub({ hubId, hub }) {
    const hubDb = await connection(hubTable);
    return (async () => undefined)()
    .then(async () => {
      if (hubId && !await hubDb.get(hubId)) throw createHttpError(400);
    })
    .then(() => hubDb.put({ key: hubId, hub }))
    .then(({ key }) => ({ hubId: key }));
  }

  async putPerson({ hubId, personId, person }) {
    const hubDb = await connection(hubTable);
    const personDb = await connection(personTable);
    return hubDb.get(hubId)
    .then(record => {
      if (!record) throw createHttpError(404);
      return record;
    })
    .then(async () => {
      if (!personId) return {};
      const exist = await personDb.get(personId);
      if (!exist) throw createHttpError(400);
      return exist.person;
    })
    .then(exist => {
      person.createdAt = exist.createdAt || new Date().toISOString();
      return personDb.put({ key: personId, hubId, person });
    })
    .then(({ key }) => ({ personId: key }));
  }

  async removePerson({ hubId, personId }) {
    const hubDb = await connection(hubTable);
    const personDb = await connection(personTable);
    return hubDb.get(hubId)
    .then(record => {
      if (!record) throw createHttpError(404);
      return record;
    })
    .then(async () => {
      if (!await personDb.get(personId)) throw createHttpError(400);
    })
    .then(() => personDb.delete(personId));
  }
}

export const service = new Service();

export default {
  Service,
  service,
};
