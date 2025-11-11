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
  busy: 0,
  busyList: [],
  stack: [],
  audioContext: undefined,
  audioBuffer: undefined,

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
    if (self.audioContext) {
      logger.info('existing audioContext');
      return;
    }
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
    if (self.busy) {
      if (self.busy === 1) {
        const [date, time] = dayjs().add(9, 'hour').toISOString().split(/[T.]/);
        self.busyList.unshift({ num: 1, date, time });
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
    self.busy = 1;
    self.updateDate()
    .then(() => {
      self.busyText = '';
      self.busy = 0;
    });
  },

  interval() {
    setTimeout(() => {
      setInterval(() => self.checkDate(), 1000);
    }, 1000 - (Date.now() % 1000));
  },

  async preloadContext() {
    const arrayBuffer = await fetch('/assets/mp3/warning1.mp3')
    .then(res => res.arrayBuffer())
    .catch(() => new ArrayBuffer());
    self.audioContext = new AudioContext();
    self.audioContext.addEventListener('statechange', event => {
      logger.info('statechange', event);
    });
    self.audioBuffer = await self.audioContext.decodeAudioData(arrayBuffer);
  },

  async playSound() {
    const audioSource = self.audioContext.createBufferSource();
    audioSource.buffer = self.audioBuffer;
    audioSource.connect(self.audioContext.destination);
    audioSource.addEventListener('ended', () => {
      audioSource.disconnect();
      logger.info('disconnect audioSource');
    });
    audioSource.start();
  },

  async play() {
    if (self.latest && (self.latest + 60000) > Date.now()) return;
    self.latest = Date.now();
    if (self.audioBuffer) await self.playSound();
    logger.info(...['alert play sound.',
      self.audioBuffer?.length ?? 'incomplete load audio buffer',
    ]);
  },
};

createApp({
  setup() {
    return Object.assign(self, Ocean);
  },

  mounted() {
    self.start();
    setTimeout(() => { self.action(); }, 2000);
    document.addEventListener('click', () => {
      self.statusText = '';
    });
  },
}).mount('#app');
