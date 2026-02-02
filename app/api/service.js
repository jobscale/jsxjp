import os from 'os';
import crypto from 'crypto';
import dayjs from 'dayjs';
import webPush from 'web-push';
import nodemailer from 'nodemailer';
import createHttpError from 'http-errors';
import { logger } from '@jobscale/logger';
import { Slack } from '@jobscale/slack';
import { service as configService } from '../config/service.js';
import { db } from '../db.js';
import { store } from '../store.js';
import { genDigit, verifyDigit } from './index.js';

const LIMIT_TTL = 5_400; // seconds

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
  return `${timestamp}+9`;
};

export class Service {
  async slack(rest) {
    const env = await configService.getEnv('slack');
    return new Slack(env).send(rest)
    .then(res => logger.info(res))
    .catch(e => logger.error(e));
  }

  async email({ to, subject, text }) {
    const env = await configService.getEnv('smtp');
    const smtp = nodemailer.createTransport(env.auth);
    return smtp.sendMail({
      to, subject, text, from: env.from,
    })
    .then(res => logger.info(res))
    .catch(e => {
      logger.error(e);
      throw e;
    });
  }

  async sendmail({ secret, digit, content }) {
    const { to, subject, text } = content;
    setTimeout(() => this.webPush({ title: subject, body: text }), 0);
    const ok = await verifyDigit(secret, digit);
    if (!ok) throw createHttpError(403);
    await this.email({ to, subject, text });
    return { ts: formatTimestamp() };
  }

  async public() {
    const cert = await db.getValue('config/certificate', 'secret');
    return cert.public;
  }

  render(template, data) {
    return Object.entries({
      TEMPLATE_LOGIN: data.login ?? 'anonymous',
      TEMPLATE_HOST: data.host ?? 'unknown host',
    }).reduce(
      (str, [key, value]) => str.replaceAll(`{{${key}}}`, value ?? ''),
      template,
    );
  }

  async publish(payload, users) {
    if (!this.cert) {
      this.cert = await db.getValue('config/certificate', 'secret');
      webPush.setVapidDetails(
        'mailto:jobscale@example.com',
        this.cert.public,
        this.cert.key,
      );
    }

    await Promise.all(
      users.filter(user => user.subscription)
      .map(async user => {
        const { subscription } = user;
        const body = this.render(payload.body, user);
        const notification = { ...payload, body };
        logger.info(JSON.stringify(notification));
        if (subscription.token) {
          // FCM for Capacitor
          await this.publishFcm(subscription, notification);
          return;
        }
        // Web Push
        await this.publishWeb(subscription, notification);
      }),
    );
  }

  async publishWeb(subscription, notification) {
    await webPush.sendNotification(subscription, JSON.stringify(notification), { TTL: LIMIT_TTL })
    .then(res => logger.info('publishWeb', JSON.stringify({ ...res }, notification)))
    .catch(e => logger.error('publishWeb', JSON.stringify({ ...e }, notification)));
  }

  async publishFcm(subscription, notification) {
    const fcmKey = await configService.getEnv('fcm');
    const payload = {
      to: subscription.token,
      notification,
      time_to_live: LIMIT_TTL,
    };
    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${fcmKey}`,
      },
      body: JSON.stringify(payload),
    })
    .then(res => res.json())
    .then(res => logger.info('publishFcm', JSON.stringify({ ...res }, notification)))
    .catch(e => logger.error('publishFcm', JSON.stringify({ ...e }, notification)));
  }

  async webPush(rest) {
    const { title } = rest;
    const expired = formatTimestamp(dayjs().add(22, 'minute'));
    const body = [
      rest.body,
      '',
      '{{TEMPLATE_LOGIN}} - {{TEMPLATE_HOST}}',
    ].join('\n');
    const payload = {
      title, expired, body, icon: '/icon/cat-point.svg',
    };
    if (!this.users || this.usersExpires < Date.now()) {
      // refresh 10 minutes
      this.usersExpires = Date.now() + 600_000;
      this.users = await store.getValue('web/users', 'info');
    }
    const users = Object.values(this.users || {}).filter(user => user.login === 'alice');
    await this.publish(payload, users);
  }

  async subscribeUser(text, user) {
    const title = '通知';
    const expired = formatTimestamp(dayjs().add(22, 'minute'));
    const body = [
      text,
      '',
      '{{TEMPLATE_LOGIN}} - {{TEMPLATE_HOST}}',
    ].join('\n');
    const payload = {
      title, expired, body, icon: '/icon/cat-walk.svg',
    };
    await this.publish(payload, [user]);
  }

  async subscription(rest, login) {
    const {
      endpoint, expirationTime, keys, token,
      ts, ua, host,
    } = rest;
    let subscription;
    let hash;
    if (token) {
      // Capacitor FCM token
      subscription = { token };
      hash = crypto.createHash('sha3-256').update(token).digest('base64');
    } else {
      // Web Push subscription
      subscription = { endpoint, expirationTime, keys };
      hash = crypto.createHash('sha3-256').update(endpoint).digest('base64');
    }
    const users = await store.getValue('web/users', 'info') ?? {};
    if (users[hash]) {
      if (!login || users[hash].login === login) return { exist: true };
      users[hash].login = login;
      users[hash].host = host;
      await store.setValue('web/users', 'info', users);
      await this.subscribeUser('通知先を「更新」しました', users[hash]);
      return { update: true };
    }
    users[hash] = { login, host, subscription, ts, ua };
    await store.setValue('web/users', 'info', users);
    await this.subscribeUser('通知先を「登録」しました', users[hash]);
    return { register: true };
  }

  async getNumber() {
    return genDigit();
  }

  async hostname() {
    return {
      hostname: os.hostname(),
      ip: await fetch('https://inet-ip.info/ip')
      .then(res => res.text()).catch(e => e.message),
    };
  }
}

export const service = new Service();
export default { Service, service };
