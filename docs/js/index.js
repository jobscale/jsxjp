import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import dayjs from 'https://esm.sh/dayjs';

const logger = console;

class Titan {
  constructor(data) {
    Object.assign(this, data);
  }

  onColorScheme() {
    const html = document.querySelector('html');
    html.classList.toggle('dark-scheme');
    html.classList.toggle('light-scheme');
  }

  start() {
    logger.info('Start jsx.jp');
    setTimeout(() => this.interval(), 200);
  }

  async action() {
    if (this.audioContext) {
      logger.info('existing audioContext');
      return;
    }
    this.actionText = 'loading...';
    this.preloadContext().then(() => { this.actionText = '☃'; })
    .then(this.serverName).then(host => { this.welcomeText = host; });
  }

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
  }

  updateSpan() {
    if (!this.stack.length) return;
    if (this.stack.length > 60) this.stack.length = 60;
    const span = Math.floor(this.stack.reduce((a, b) => a + b, 0.0)) / this.stack.length;
    this.spanText = span.toFixed(1);
  }

  sign() {
    return fetch('/auth/sign', {
      method: 'HEAD',
    });
  }

  updateDate() {
    const params = {
      begin: performance.now(),
      warn: setTimeout(() => this.play(), 2000),
    };
    return this.sign()
    .then(res => res.headers.get('date'))
    .then(gmt => {
      clearTimeout(params.warn);
      const span = Math.floor((performance.now() - params.begin) * 10) / 10;
      const serverTime = new Date(new Date(gmt).getTime() + span);
      if (!this.stack.length) {
        const diff = Math.floor((Date.now() - serverTime.getTime()) / 100) / 10;
        this.actionText += ` ${diff}`;
      }
      const [date, time] = dayjs(serverTime).add(9, 'hour').toISOString().split(/[T.]/);
      this.dateText = `${date} ${time}`;
      this.stack.unshift(span);
      this.updateSpan();
    })
    .catch(e => {
      this.dateText = e.message;
    });
  }

  checkDate() {
    if (this.busy) {
      if (this.busy === 1) {
        const [date, time] = dayjs().add(9, 'hour').toISOString().split(/[T.]/);
        this.busyList.unshift({ num: 1, date, time });
        this.busyTimes.unshift(time);
        if (this.busyTimes.length > 16) this.busyTimes.length = 16;
      }
      this.busyList[0].num++;
      this.busy++;
      this.busyText = `${this.busy} 🍺`;
      if (this.stack.length > 10) this.stack.length = 10;
      if (!this.stack.length) this.stack.push(1000.0);
      else this.stack[0] += 1000;
      this.updateSpan();
      return;
    }
    this.busy = 1;
    this.updateDate()
    .then(() => {
      this.busyText = '';
      this.busy = 0;
    });
  }

  interval() {
    setTimeout(() => {
      setInterval(() => this.checkDate(), 1000);
    }, 1000 - (Date.now() % 1000));
  }

  async preloadContext() {
    const arrayBuffer = await fetch('/assets/mp3/warning1.mp3')
    .then(res => res.arrayBuffer())
    .catch(() => new ArrayBuffer());
    this.audioContext = new AudioContext();
    this.audioContext.addEventListener('statechange', event => {
      logger.info('statechange', event);
    });
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  async playSound() {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(e => logger.warn(e.message));
    }
    const audioSource = this.audioContext.createBufferSource();
    audioSource.buffer = this.audioBuffer;
    audioSource.connect(this.audioContext.destination);
    audioSource.addEventListener('ended', () => {
      audioSource.disconnect();
      logger.info('disconnect audioSource');
    });
    Promise.resolve().then(() => audioSource.start())
    .catch(e => logger.warn(e.message));
  }

  async play() {
    if (this.latest && (this.latest + 60000) > Date.now()) return;
    this.latest = Date.now();
    if (this.audioBuffer) await this.playSound();
    logger.info(...['alert play sound.',
      this.audioBuffer?.length ?? 'incomplete load audio buffer',
    ]);
  }

  expose() {
    const func = {};
    ['start', 'action', 'onColorScheme'].forEach(name => {
      func[name] = this[name].bind(this);
    });
    return func;
  }
}

createApp({
  setup() {
    const data = reactive({
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
    });
    const titan = new Titan(data);
    return {
      ...data,
      ...titan.expose(),
    };
  },

  mounted() {
    this.start();
    setTimeout(() => { this.action(); }, 2000);
  },
}).mount('#app');
