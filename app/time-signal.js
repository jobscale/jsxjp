import webpush from 'web-push';
import { Logger } from '@jobscale/logger';
import { db } from './db.js';

const logger = new Logger({ timestamp: true, noPathName: true });

const formatTimestamp = ts => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(ts || new Date());

export class TimeSignal {
  async timeSignal() {
    const now = new Date();
    const current = formatTimestamp(now);
    const [, mm, ss] = current.split(':');
    if (`${mm}:${ss}` === '59:00' || !this.users) {
      this.users = (await db.getValue('web/users', 'info')) || {};
    }
    if (`${mm}:${ss}` !== '59:50') return;
    now.setSeconds(now.getSeconds() + 10);
    const timestamp = formatTimestamp(now);

    if (!this.cert) {
      this.cert = await db.getValue('config/certificate', 'secret');
      webpush.setVapidDetails(
        'mailto:jobscale@example.com',
        this.cert.public,
        this.cert.key,
      );
    }

    await Promise.all(
      Object.values(this.users)
      .filter(user => user.subscription)
      .map(user => {
        const { subscription } = user;
        return webpush.sendNotification(subscription, JSON.stringify({
          title: 'Time Signal',
          body: `Time is it ${timestamp}`,
          icon: '/favicon.ico',
        }))
        .then(() => logger.info('sendNotification', JSON.stringify(user)))
        .catch(e => logger.error(e, JSON.stringify(user)));
      }),
    );
  }

  async startTimeSignal() {
    const loop = async () => {
      await this.timeSignal();
      setTimeout(loop, 1000 - (Date.now() % 1000));
    };
    loop();
  }
}

export const timeSignal = new TimeSignal();

export default {
  TimeSignal,
  timeSignal,
};
