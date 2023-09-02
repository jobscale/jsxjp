const os = require('os');
const nodemailer = require('nodemailer');
const { logger } = require('@jobscale/logger');
const { Slack } = require('@jobscale/slack');
const { service: configService } = require('../config/service');

const { PARTNER_HOST } = process.env;

class Service {
  async slack(rest) {
    const env = await configService.getEnv('slack');
    return new Slack(env).send(rest)
    .then(res => logger.info(res))
    .catch(e => logger.error(e));
  }

  async email(rest) {
    const env = await configService.getEnv('smtp');
    const smtp = nodemailer.createTransport(env);
    return smtp.sendMail({
      ...rest,
      from: 'no-reply@jsx.jp',
    })
    .then(res => logger.info(res))
    .catch(e => logger.error(e));
  }

  async hostname() {
    return {
      hostname: os.hostname(),
      ip: await fetch('https://inet-ip.info/ip')
      .then(res => res.text()).catch(e => e.message),
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
}

module.exports = {
  Service,
  service: new Service(),
};
