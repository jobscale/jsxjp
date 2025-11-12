import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';

const logger = console;

const formatTimestamp = ts => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(ts || new Date());

const self = reactive({});

const Ocean = {
  statusText: 'muted',
  actionText: '[⛄ 🍻]',
  welcomeText: 'welcome',
  spanText: 'guest',
  dateText: '☃',
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

  async updateDate() {
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
      self.dateText = formatTimestamp(serverTime);
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
        const [date, time] = formatTimestamp().split(' ');
        self.busyList.unshift({ num: 0, date, time });
        if (self.busyList.length > 500) self.busyList.pop();
      }
      self.busyList[0].num++;
      self.busy++;
      self.busyText = `${self.busy} 🍺`;
      if (self.stack.length > 10) self.stack.length = 10;
      if (!self.stack.length) self.stack.push(1000.0);
      else self.stack[0] += 1000;
      self.updateSpan();
      self.drawBusyChart();
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

  drawBusyChart() {
    const colorList = [];
    for (let i = 0; i < 5; i++) {
      const r = i * 3;
      colorList.push(`#${r.toString(16)}8${(15 - r).toString(16)}`);
    }
    const canvas = document.getElementById('busyChart');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    canvas.width = Math.min(
      self.busyList.length * 3,
      Math.floor(window.innerWidth * 0.8),
    );
    canvas.height = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const data = self.busyList.map(item => item.num);
    const max = Math.max(...data, 1);
    const barWidth = canvas.width / data.length;
    data.forEach((num, index) => {
      const barHeight = (num / max) * canvas.height;
      const color = Math.min(Math.floor(num / 3), colorList.length - 1);
      ctx.fillStyle = colorList[color];
      ctx.fillRect(index * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
    });
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
    if (self.statusText === 'muted') return;
    if (self.latest && (self.latest + 60000) > Date.now()) return;
    self.latest = Date.now();
    logger.info(new Date(), 'alert play sound.');
    await self.playSound();
  },

  mute() {
    self.statusText = self.statusText ? '' : 'muted';
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
