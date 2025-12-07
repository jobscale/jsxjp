import os from 'os';
import crypto from 'crypto';
import webPush from 'web-push';
import nodemailer from 'nodemailer';
import { logger } from '@jobscale/logger';
import { Slack } from '@jobscale/slack';
import { service as configService } from '../config/service.js';
import { db } from '../db.js';
import { store } from '../store.js';

const { PARTNER_HOST } = process.env;

export class Service {
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

  async public() {
    const cert = await db.getValue('config/certificate', 'secret');
    return cert.public;
  }

  async subscription(rest, login) {
    const {
      endpoint, expirationTime, keys: { auth, p256dh },
      ts, ua, host,
    } = rest;
    const subscription = { endpoint, expirationTime, keys: { auth, p256dh } };
    const users = await store.getValue('web/users', 'info') ?? {};
    const hash = crypto.createHash('sha3-256').update(endpoint).digest('base64');
    if (users[hash]) {
      if (!login || users[hash].login === login) return { exist: true };
      users[hash].login = login;
      users[hash].host = host;
      await store.setValue('web/users', 'info', users);
      await this.publish(subscription, '通知先を「更新」しました');
      return { update: true };
    }
    users[hash] = { login, host, subscription, ts, ua };
    await store.setValue('web/users', 'info', users);
    await this.publish(subscription, '通知先を「登録」しました');
    return { succeeded: true };
  }

  async publish(subscription, body) {
    if (!this.cert) {
      this.cert = await db.getValue('config/certificate', 'secret');
      webPush.setVapidDetails(
        'mailto:jobscale@example.com',
        this.cert.public,
        this.cert.key,
      );
    }

    const payload = {
      title: '通知',
      body,
      icon: '/favicon.ico',
    };
    return webPush.sendNotification(subscription, JSON.stringify(payload))
    .then(() => logger.info('sendNotification', JSON.stringify(subscription)))
    .catch(e => {
      logger.error(e, JSON.stringify(subscription));
    });
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

export const service = new Service();

export default { Service, service };
