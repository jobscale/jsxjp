const { Deta } = require('deta');
const { fetch } = require('@jobscale/fetch');
const { plan } = require('./js-proxy');

const { PARTNER_HOST } = process.env;

class DB {
  async allowInsecure(use) {
    if (use === false) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  fetchEnv() {
    if (!this.cache) this.cache = {};
    if (this.cache.env) return Promise.resolve(this.cache.env);
    const params = {
      host: 'https://partner.credentials.svc.cluster.local',
    };
    if (PARTNER_HOST) {
      params.host = PARTNER_HOST;
    }
    const Cookie = 'X-AUTH=X0X0X0X0X0X0X0X';
    const request = [
      `${params.host}/db.env.json`,
      { headers: { Cookie } },
    ];
    return this.allowInsecure()
    .then(() => fetch.get(...request))
    .then(res => this.allowInsecure(false) && res)
    .then(res => {
      this.cache.env = res.data;
      return this.cache.env;
    });
  }

  async getDetaKey() {
    const { DETA_PROJECT_KEY } = process.env;
    if (DETA_PROJECT_KEY) return DETA_PROJECT_KEY;
    if (plan) return plan();
    return this.fetchEnv()
    .then(env => env.DETA_PROJECT_KEY);
  }

  async connectDB() {
    if (!this.cache) this.cache = {};
    if (this.cache.db) return this.cache.db;
    const { ENV } = process.env;
    const detaKey = await this.getDetaKey();
    const deta = Deta(detaKey);
    this.cache.db = deta.Base(`${ENV || 'dev'}-user`);
    return this.cache.db;
  }
}

module.exports = {
  connection: () => new DB().connectDB(),
};
