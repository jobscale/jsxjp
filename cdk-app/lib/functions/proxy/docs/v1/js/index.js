import { createApp, reactive, computed, nextTick } from 'https://esm.sh/vue/dist/vue.esm-browser.js';
import { logger } from 'https://esm.sh/@jobscale/create-logger';
import { formatTimestamp } from '/v1/js/timestamp.js';
import { fetchApi } from '/v1/js/fetch-api.js';

let self = {
  statusText: 'muted',
  actionText: '[⛄ 🍻]',
  welcomeText: 'welcome',
  xUser: '☃',
  xAddress: '☃',
  refresh: '☃',
  dateText: '☃',
  busyText: '',
  busy: undefined,
  busyList: [],
  stack: [],
  latestPlay: 0,
  latestSpeed: 0,
  speedText: '☃',
  realSpeedText: '☃',

  onColorScheme() {
    const html = document.documentElement;
    const current = html.style.colorScheme;
    const next = current ? current === 'dark' ? 'light' : 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    html.style.colorScheme = next;
    html.dataset.theme = next;
  },

  async start() {
    logger.info('Start jsx.jp');
    setTimeout(() => self.interval(), 200);
  },

  async action() {
    self.actionText = 'loading...';
    await self.preloadContext().then(() => { self.actionText = '☃'; })
    .then(self.serverName).then(host => { self.welcomeText = host; });
  },

  async serverName() {
    return fetch('/favicon.ico', { method: 'HEAD' })
    .then(res => {
      const { headers } = res;
      const key = [
        'x-backend-host', 'x-host', 'x-server', 'x-served-by', 'server', 'powered-by',
      ].find(name => headers.get(name));
      const hostname = headers.get(key) ?? 'nobody';
      const showName = hostname.split('-').filter(Boolean).slice(-3).join('-');
      return showName;
    })
    .catch(e => logger.warn(e.message) ?? 'oops');
  },

  sign() {
    return fetchApi('/auth/sign', {
      method: 'HEAD',
    });
  },

  async updateDate() {
    const params = {
      begin: performance.now(),
      warn: setTimeout(() => {
        self.onSpeed();
        self.play();
      }, 2000),
    };
    return self.sign()
    .then(res => {
      self.xUser = res.headers.get('x-user') ?? 'guest';
      const xAddress = res.headers.get('x-address') ?? 'broken';
      if (self.xAddress !== xAddress) {
        self.xAddress = xAddress;
        self.refresh = formatTimestamp(Date.now(), true);
      }
      return res.headers.get('date');
    })
    .then(gmt => {
      clearTimeout(params.warn);
      const span = Math.floor((performance.now() - params.begin) * 10) / 10;
      const serverTime = new Date(new Date(gmt).getTime() + span);
      if (!self.stack.length) {
        const diff = Math.floor((Date.now() - serverTime.getTime()) / 100) / 10;
        if (diff) self.actionText += ` ${diff}`;
      }
      self.dateText = formatTimestamp(serverTime, true);
      self.stack.unshift(span);
      if (self.stack.length > 60) self.stack.length = 60;
    })
    .catch(e => {
      self.dateText = e.message;
    });
  },

  checkDate() {
    if (self.busy !== undefined) {
      if (self.busy === 0) {
        const [date, time] = formatTimestamp(Date.now(), true).split(' ');
        self.busyList.unshift({ num: 0, date, time });
        if (self.busyList.length > 500) self.busyList.pop();
        nextTick(() => {
          document.querySelector('.busy:last-of-type').scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        });
      }
      self.busyList[0].num++;
      self.busy++;
      self.busyText = `${self.busy} 🍺`;
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
    }, 1000 - Date.now() % 1000);
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
    const width = self.busyList.length * 3;
    const height = 40;
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    const data = self.busyList.map(item => Math.min(20, item.num));
    const max = Math.max(...data, 1);
    const barWidth = width / data.length;
    [...data].reverse().forEach((num, index) => {
      const barHeight = num / max * height;
      const color = Math.min(Math.floor(num / 3), colorList.length - 1);
      ctx.fillStyle = colorList[color];
      ctx.fillRect(index * barWidth, height - barHeight, barWidth - 2, barHeight);
    });
  },

  onSpeed() {
    self.realSpeedText = 'measuring...';
    self.speedText = 'measuring...';
    self.speed().catch(e => {
      const message = e.cause?.message ?? e.cause ?? e.message;
      logger.error(message);
      self.realSpeedText = message;
      self.speedText = message;
    });
  },

  async speed() {
    const now = Date.now();
    if (self.latestSpeed + 2_000 > now) throw new Error('... too fast request');
    self.latestSpeed = now;

    performance.clearResourceTimings();
    const start = Date.now();
    const res = await fetchApi('/api/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: start }),
    });
    if (!res.ok) throw new Error(`HTTP unsuccessful: ${res.status}`);
    const blob = await res.blob();
    const duration = Date.now() - start;
    logger.debug(`received size: ${blob.size} / ${2 ** 20 / 8} bytes in ${duration} ms`);
    // 全体の経過時間での計算 (RTT含む)
    const safeDuration = Math.max(duration, 1);
    self.realSpeedText = `${(blob.size * 8 / safeDuration / 1000).toFixed(2)} Mbps (${duration} ms) real`;
    // resource から探す
    const resources = performance.getEntriesByType('resource');
    const entry = resources.findLast(file => file.name.match('/api/speed'));
    if (!entry) throw new Error('performance entry not found');
    // CORS制限などで 0 が返ってきた場合のガード節（異常値の防止）
    if (!(entry.responseStart > 0 && entry.responseEnd > 0)) {
      throw new Error('Check Timing-Allow-Origin header');
    }
    // Performance API での計算 (純粋なダウンロード時間)
    const downloadTimeMs = Math.max(Math.round(entry.responseEnd - entry.responseStart), 1);
    const mbps = blob.size * 8 / (downloadTimeMs / 1000) / 1000000;
    const rtt = Math.round(entry.responseStart - entry.startTime);
    self.speedText = `${mbps.toFixed(2)} Mbps (${downloadTimeMs} ms), RTT: ${rtt} ms`;
  },

  async preloadContext() {
    if (self.audio) return;
    self.audio = await fetch('/v1/assets/mp3/warning1.mp3')
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
    if (self.latestPlay && self.latestPlay + 60_000 > Date.now()) return;
    self.latestPlay = Date.now();
    logger.info(new Date(), 'alert play sound.');
    await self.playSound();
  },

  mute() {
    self.statusText = self.statusText ? '' : 'muted';
  },
};
Object.assign(self, {
  busyLatests: computed(() => self.busyList.slice(0, 12).map(v => v.time).join('\n')),
  speedLatest: computed(() => formatTimestamp(self.latestSpeed, true)),
  spanText: computed(() => {
    if (!self.stack.length) return '🍰';
    const span = Math.floor(self.stack.reduce((a, b) => a + b, 0)) / self.stack.length;
    return span.toFixed(1);
  }),
});
self = reactive(self);

createApp({
  setup() {
    return self;
  },

  async mounted() {
    self.onColorScheme();
    await self.start();
    setTimeout(() => { self.action(); }, 2000);
    document.addEventListener('click', () => { self.statusText = ''; });
    // unmute via user interaction for audio autoplay policy
    setTimeout(() => { document.querySelector('.muted')?.focus(); }, 1000);
  },
}).mount('#app');
