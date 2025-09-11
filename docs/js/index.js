import { createApp } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import dayjs from 'https://esm.sh/dayjs';
import { logger } from 'https://esm.sh/@jobscale/logger';

createApp({
  data() {
    return {
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
    };
  },

  mounted() {
    this.start();
    setTimeout(() => { this.action(); }, 2000);
  },

  methods: {
    onColorScheme() {
      const html = document.querySelector('html');
      html.classList.toggle('dark-scheme');
      html.classList.toggle('light-scheme');
    },

    start() {
      logger.info('Start jsx.jp');
      setTimeout(() => this.interval(), 200);
    },

    async action() {
      if (this.audioContext) {
        logger.info('existing audioContext');
        return;
      }
      this.actionText = 'loading...';
      fetch('/assets/mp3/warning1.mp3')
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => {
        this.audioContext = new AudioContext();
        this.audioBuffer = this.audioContext.decodeAudioData(arrayBuffer);
        this.actionText = '☃';
      });
      fetch('/favicon.ico')
      .then(res => {
        const { headers } = res;
        const key = ['x-backend-host', 'x-host', 'x-server', 'x-served-by', 'server'].find(name => headers.get(name));
        return headers.get(key);
      })
      .catch(e => logger.warn(e.message))
      .then(host => {
        this.welcomeText = host;
      });
    },

    updateSpan() {
      if (!this.stack.length) return;
      if (this.stack.length > 60) this.stack.length = 60;
      const span = Math.floor(this.stack.reduce((a, b) => a + b, 0.0)) / this.stack.length;
      this.spanText = span.toFixed(1);
    },

    sign() {
      return fetch('/auth/sign', {
        method: 'HEAD',
      });
    },

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
    },

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
    },

    interval() {
      setTimeout(() => {
        setInterval(() => this.checkDate(), 1000);
      }, 1000 - (Date.now() % 1000));
    },

    async play() {
      if (this.latest && (this.latest + 60000) > Date.now()) return;
      this.latest = Date.now();
      const play = () => this.audioBuffer.then(buffer => {
        const audioSource = this.audioContext.createBufferSource();
        audioSource.buffer = buffer;
        audioSource.connect(this.audioContext.destination);
        audioSource.addEventListener('ended', () => {
          audioSource.disconnect();
          logger.info('disconnect audioSource');
        });
        audioSource.start();
        return audioSource;
      });
      const actions = ['alert play sound.', this.latest, await play()];
      logger.info(...actions);
    },
  },
}).mount('#app');
