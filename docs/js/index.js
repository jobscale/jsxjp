/* global logger, Howl, dayjs */

Vue.createApp({
  data() {
    return {
      actionText: '[⛄ 🍻]',
      welcomeText: 'welcome',
      spanText: 'guest',
      dateText: '☃',
      sound: undefined,
      busyTimes: [],
      busyText: '',
      busy: 0,
      busyList: [],
      stack: [],
    };
  },

  mounted() {
    this.start();
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
      if (this.sound) {
        logger.info(`Sound existing.`);
        return;
      }
      this.actionText = 'loading...';
      // this.sound = new Howl({ src: ['//jsx.jp/assets/mp3/warning1.mp3'] });
      const b64 = await fetch('/assets/mp3/warning1.mp3.b64')
      .then(res => res.text());
      // Without Binary
      this.sound = new Howl({ src: [`data:audio/x-mp3;base64,${b64}`] });
      this.sound.once('load', () => {
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

    updateDate() {
      const params = {
        req: [
          `/timestamp?v=${Date.now()}`,
          { method: 'head' },
        ],
        begin: performance.now(),
        warn: setTimeout(() => this.play(), 2000),
      };
      return fetch(...params.req)
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
          this.busyList.unshift(1);
          const [, time] = dayjs().add(9, 'hour').toISOString().split(/[T.]/);
          this.busyTimes.unshift(time);
          if (this.busyTimes.length > 16) this.busyTimes.length = 16;
        }
        this.busyList[0]++;
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

    play() {
      if (this.latest && (this.latest + 60000) > Date.now()) return;
      this.latest = Date.now();
      const play = () => this.sound && this.sound.play();
      const actions = ['alert play sound.', this.latest, play()];
      logger.info(...actions);
    },
  },
}).mount('#app');
