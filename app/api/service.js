const os = require('os');
const { Slack } = require('@jobscale/slack');

class Service {
  slack(rest) {
    return this.fetchEnv()
    .then(env => new Slack(env).send(rest))
    .then(res => ({ ...res, ts: Date.now() }));
  }

  async hostname() {
    return {
      hostname: os.hostname(),
      ip: await fetch('https://inet-ip.info/ip').then(res => res.text()).catch(e => e.message),
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
  Service,
  service: new Service(),
};
