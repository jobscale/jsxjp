const createHttpError = require('http-errors');
const { connection } = require('../db');

const { ENV } = process.env;
const hubTable = `${ENV || 'dev'}-pp-hub`;
const personTable = `${ENV || 'dev'}-pp-person`;

class Service {
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
      if (personId && !await personDb.get(personId)) throw createHttpError(400);
    })
    .then(() => personDb.put({ key: personId, hubId, person }))
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

module.exports = {
  Service,
  service: new Service(),
};
