const { Slack } = require('@jobscale/slack');
const { Service } = require('../service');

class ApiService extends Service {
  slack(rest) {
    return this.fetchEnv()
    .then(env => new Slack(env).send(rest))
    .then(res => ({ ...res, ts: Date.now() }));
  }

  async hostname() {
    return {
      hostname: process.env.HOSTNAME,
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
    if (process.env.SLACK_HOST) {
      params.host = process.env.SLACK_HOST;
    }
    const Cookie = 'X-AUTH=X0X0X0X0X0X0X0X';
    const request = [
      `${params.host}/slack.env.json`,
      { method: 'GET', headers: { Cookie } },
    ];
    return this.allowInsecure()
    .then(() => fetch(...request))
    .then(res => this.allowInsecure(false) && res)
    .then(res => res.json())
    .then(env => {
      this.cache.env = env;
      return env;
    });
  }
}

module.exports = {
  ApiService,
  apiService: new ApiService(),
};
