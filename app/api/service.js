const os = require('os');
const { Slack } = require('@jobscale/slack');
const { fetch } = require('@jobscale/fetch');
const { planEight } = require('../js-proxy');

const { ENV, PARTNER_HOST } = process.env;

class Service {
  slack(rest) {
    return this.getKey()
    .then(env => new Slack(env).send(rest))
    .then(res => ({ ...res, ts: Date.now() }));
  }

  async hostname() {
    return {
      hostname: os.hostname(),
      ip: await fetch.get('https://inet-ip.info/ip').catch(e => e.message),
    };
  }

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
      `${params.host}/slack.env.json`,
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

  getKey() {
    if (planEight) return JSON.parse(planEight(ENV));
    return this.fetchEnv();
  }
}

module.exports = {
  Service,
  service: new Service(),
};
