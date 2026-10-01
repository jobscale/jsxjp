import crypto from 'crypto';
import webPush from 'web-push';
import { createLogger } from '@jobscale/create-logger';
import { db } from './db.js';
import { store } from './store.js';
import { getHoliday } from './holiday.js';
import { formatTimestamp } from './timestamp.js';

const { LOG_LEVEL } = process.env;
const logger = createLogger({ level: LOG_LEVEL });

const sliceByUnit = (list, digit) => Array.from(
  { length: Math.ceil(list.length / digit) },
  (_, i) => list.slice(i * digit, i * digit + digit),
);

export class TimeSignal {
  async pushSignal(payload, users) {
    await Promise.all(
      users.filter(user => user.subscription)
      .map(user => {
        const { subscription } = user;
        return webPush.sendNotification(subscription, JSON.stringify(payload))
        .then(() => logger.info('sendNotification', JSON.stringify(user)))
        .catch(e => {
          logger.error(e, JSON.stringify(user));
          const hash = crypto.createHash('sha3-256').update(subscription.endpoint).digest('base64');
          delete this.users[hash];
        });
      }),
    );
  }

  async timeSignal() {
    const now = new Date();
    const current = formatTimestamp({ ts: now });
    const [, mm, ss] = current.split(':');
    if (`${mm}:${ss}` === '59:00' || !this.users) {
      this.users = await store.getValue('web/users', 'info');
    }
    if (`${mm}:${ss}` !== '59:50') return;
    now.setSeconds(now.getSeconds() + 10);

    if (!this.cert) {
      this.cert = await db.getValue('config/certificate', 'secret');
      webPush.setVapidDetails(
        'mailto:jobscale@example.com',
        this.cert.public,
        this.cert.key,
      );
    }

    const timestamp = formatTimestamp({ ts: now });
    const holidays = await getHoliday();
    const body = [`Time is it ${timestamp}`, '', ...holidays].join('\n');
    const payload = {
      title: 'Time Signal',
      body,
      icon: '/favicon.ico',
    };
    const unitUsers = sliceByUnit(Object.values(this.users), 10);
    for (const unit of unitUsers) {
      await this.pushSignal(payload, unit);
    }
    const total = unitUsers.reduce((a, b) => a + b.length, 0);
    if (Object.keys(this.users).length < total) {
      await store.setValue('web/users', 'info', this.users);
    }
  }

  async startTimeSignal() {
    const loop = async () => {
      await this.timeSignal();
      setTimeout(loop, 1000 - Date.now() % 1000);
    };
    loop();
  }
}

export const timeSignal = new TimeSignal();

export default { TimeSignal, timeSignal };
