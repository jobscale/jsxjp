import { createApp, reactive, computed } from 'https://esm.sh/vue/dist/vue.esm-browser.js';
import { logger } from 'https://esm.sh/@jobscale/create-logger';
import { loading } from 'https://esm.sh/@jobscale/loading';
import { formatTimestamp } from '/v1/js/timestamp.js';
import { fetchApi } from '/v1/js/fetch-api.js';

const sliceUnit = (list, digit) => Array.from({ length: Math.ceil(list.length / digit) }, (_, i) =>
  list.slice(i * digit, i * digit + digit),
);

let self = {
  statusText: 'muted',
  actionText: '[🍻]',
  welcomeText: 'welcome',
  xUser: '☃',
  xAddress: '☃',
  refresh: '☃',
  dateText: '☃',
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

  start() {
    logger.info('Start jsx.jp');
    setTimeout(() => self.interval(), 200);
  },

  async action() {
    self.actionText = 'loading...';
    await self.preloadContext().then(() => { self.actionText = '🍷'; })
    .then(self.serverName).then(host => { self.welcomeText = host; });
  },

  async serverName() {
    return fetch('/favicon.ico', { method: 'HEAD' })
    .then(res => {
      const { headers } = res;
      const hostname = [
        'X-Backend-Host', 'X-Host', 'X-Server', 'X-Served-By', 'X-Powered-By', 'X-Amz-Cf-Pop', 'Server',
      ].map(name => headers.get(name)).find(Boolean) ?? 'nobody';
      const showName = hostname.split('-').filter(Boolean).slice(-3).join('-');
      return showName;
    })
    .catch(e => logger.warn(e.cause?.message ?? e.cause ?? e.message));
  },

  sign() {
    return fetchApi('/auth/sign', {
      method: 'HEAD',
    });
  },

  async updateDate() {
    const params = {
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
        self.refresh = formatTimestamp({ tz: false });
      }
      return res.headers.get('date');
    })
    .then(gmt => {
      clearTimeout(params.warn);
      const serverTimestamp = new Date(gmt).getTime();
      if (!Number.isFinite(serverTimestamp)) throw new Error('Invalid server date');
      const serverTime = new Date(serverTimestamp + 1000);
      const diff = Math.trunc((Date.now() - serverTime.getTime()) / 1000);
      if (diff) self.actionText = `🥃 ${diff} 🍷`;
      else self.actionText = '☃';
      self.dateText = formatTimestamp({ ts: serverTime, tz: false });
    })
    .catch(e => {
      self.dateText = e.cause?.message ?? e.cause ?? e.message;
    });
  },

  checkDate() {
    const timestamp = formatTimestamp({ tz: false });
    self.stack.unshift({ num: 0, timestamp, start: performance.now() });
    if (self.stack.length > 3600) self.stack.pop();
    self.updateDate()
    .then(() => {
      self.stack[0].num = Math.ceil(performance.now() - self.stack[0].start);
      delete self.stack[0].start;
      queueMicrotask(() => self.drawBusyChart());
    })
    .finally(() => self.interval());
  },

  interval() {
    setTimeout(() => self.checkDate(), 1000 - Date.now() % 1000);
  },

  drawBusyChart() {
    const colorList = [];
    const steps = 7;
    for (let i = 0; i < steps; i++) {
      const hue = 120 - i * 20;
      colorList.push(`hsl(${hue}, 75%, 50%)`);
    }
    const canvas = document.getElementById('busyChart');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const width = self.stack.length * 3;
    const height = 40;
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    // データポイント 3600 からグラフの粒度を 300 に落とす
    const digit = Math.max(1, Math.ceil(self.stack.length / 300));
    const dataList = sliceUnit(self.stack, digit);
    // 50ms 未満は非表示
    const data = dataList.map(
      unit => unit.reduce((max, item) => Math.max(max, item.num - 50), 0),
    );
    const max = Math.max(data.reduce((m, v) => Math.max(m, v), 0), 1);
    const barWidth = width / data.length;
    [...data].reverse().forEach((num, index) => {
      const barHeight = num / max * height;
      const color = Math.min(Math.floor(num / 1000), colorList.length - 1);
      ctx.fillStyle = colorList[color];
      ctx.fillRect(index * barWidth, height - barHeight, barWidth - 2, barHeight);
    });

    if (!canvas.dataset.hoverBound) {
      canvas.dataset.hoverBound = '1';
      canvas.addEventListener('mousemove', event => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width) { canvas.title = ''; return; }
        const item = self.hoverChart(self.stack, event.clientX - rect.left, rect.width);
        if (!item) { canvas.title = ''; return; }
        canvas.title = `${item.timestamp}\n${item.num.toString().padStart(item.timestamp.length - 2, ' ')}`;
      });
      canvas.addEventListener('mouseleave', () => {
        canvas.title = '';
      });
    }
  },

  hoverChart(list, x, width) {
    if (!list.length || width <= 0) return undefined;
    const digit = Math.max(1, Math.ceil(list.length / 300));
    const dataList = sliceUnit(list, digit);
    const index = Math.max(0, Math.min(
      Math.floor(x / width * dataList.length),
      dataList.length - 1,
    ));
    const unit = dataList[dataList.length - 1 - index];
    return unit.reduce((max, item) => item.num > max.num ? item : max);
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
  speedLatest: computed(() => formatTimestamp({ ts: self.latestSpeed, tz: false })),
  spanText: computed(() => {
    const samples = self.stack
    .filter(item => item.start === undefined)
    .slice(0, 60);
    if (!samples.length) return '🍰';
    const span = samples.reduce((sum, item) => sum + item.num, 0) / samples.length;
    return span.toFixed(1);
  }),
});
self = reactive(self);

createApp({
  setup() {
    return self;
  },

  async mounted() {
    loading(new Promise(resolve => {
      self.onColorScheme();
      self.start();
      setTimeout(() => self.action().then(() => resolve()), 2000);
      document.addEventListener('click', () => { self.statusText = ''; });
      // unmute via user interaction for audio autoplay policy
      setTimeout(() => { document.querySelector('.muted')?.focus(); }, 1000);
    }));
  },
}).mount('#app');
