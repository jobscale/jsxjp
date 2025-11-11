import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import dayjs from 'https://esm.sh/dayjs';

const logger = console;

const self = reactive({});

const Ocean = {
  statusText: 'muted',
  actionText: '[⛄ 🍻]',
  welcomeText: 'welcome',
  spanText: 'guest',
  dateText: '☃',
  busyTimes: [],
  busyText: '',
  busy: undefined,
  busyList: [],
  stack: [],
  latest: 0,

  onColorScheme() {
    const html = document.querySelector('html');
    html.classList.toggle('dark-scheme');
    html.classList.toggle('light-scheme');
  },

  start() {
    logger.info('Start jsx.jp');
    setTimeout(() => self.interval(), 200);
  },

  async action() {
    self.actionText = 'loading...';
    await self.preloadContext().then(() => { self.actionText = '☃'; })
    .then(self.serverName).then(host => { self.welcomeText = host; });
  },

  async serverName() {
    return fetch('/favicon.ico')
    .then(res => {
      const { headers } = res;
      const key = [
        'x-backend-host', 'x-host', 'x-server', 'x-served-by', 'server', 'powered-by',
      ].find(name => headers.get(name));
      const hostname = headers.get(key) ?? 'anonymous';
      const showName = hostname.split('-').filter(Boolean).slice(-3).join('-');
      return showName;
    })
    .catch(e => logger.warn(e.message) ?? 'oops');
  },

  updateSpan() {
    if (!self.stack.length) return;
    if (self.stack.length > 60) self.stack.length = 60;
    const span = Math.floor(self.stack.reduce((a, b) => a + b, 0.0)) / self.stack.length;
    self.spanText = span.toFixed(1);
  },

  sign() {
    return fetch('/auth/sign', {
      method: 'HEAD',
    });
  },

  updateDate() {
    const params = {
      begin: performance.now(),
      warn: setTimeout(() => self.play(), 2000),
    };
    return self.sign()
    .then(res => res.headers.get('date'))
    .then(gmt => {
      clearTimeout(params.warn);
      const span = Math.floor((performance.now() - params.begin) * 10) / 10;
      const serverTime = new Date(new Date(gmt).getTime() + span);
      if (!self.stack.length) {
        const diff = Math.floor((Date.now() - serverTime.getTime()) / 100) / 10;
        self.actionText += ` ${diff}`;
      }
      const [date, time] = dayjs(serverTime).add(9, 'hour').toISOString().split(/[T.]/);
      self.dateText = `${date} ${time}`;
      self.stack.unshift(span);
      self.updateSpan();
    })
    .catch(e => {
      self.dateText = e.message;
    });
  },

  checkDate() {
    if (self.busy !== undefined) {
      if (self.busy === 0) {
        const [date, time] = dayjs().add(9, 'hour').toISOString().split(/[T.]/);
        self.busyList.unshift({ num: 0, date, time });
        self.busyTimes.unshift(time);
        if (self.busyTimes.length > 16) self.busyTimes.length = 16;
      }
      self.busyList[0].num++;
      self.busy++;
      self.busyText = `${self.busy} 🍺`;
      if (self.stack.length > 10) self.stack.length = 10;
      if (!self.stack.length) self.stack.push(1000.0);
      else self.stack[0] += 1000;
      self.updateSpan();
      return;
    }
    self.busy = 0;
    self.updateDate()
    .then(() => {
      self.busyText = '';
      self.busy = undefined;
    });
  },

  interval() {
    setTimeout(() => {
      setInterval(() => self.checkDate(), 1000);
    }, 1000 - (Date.now() % 1000));
  },

  async preloadContext() {
    if (self.audio) return;
    self.audio = await fetch('/assets/mp3/warning1.mp3')
    .then(res => res.blob())
    .then(blob => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }).then(base64 => new Audio(base64));
  },

  async playSound() {
    if (!self.audio) return;
    self.audio.currentTime = 0;
    await self.audio.play()
    .then(() => logger.info('audio play sound'))
    .catch(e => logger.error('fail play sound', e.message));
  },

  async play() {
    if (self.latest && (self.latest + 60000) > Date.now()) return;
    self.latest = Date.now();
    logger.info(new Date(), 'alert play sound.');
    await self.playSound();
  },
};

createApp({
  setup() {
    return Object.assign(self, Ocean);
  },

  mounted() {
    self.start();
    setTimeout(() => { self.action(); }, 2000);
    document.addEventListener('click', () => { self.statusText = ''; });
  },
}).mount('#app');
