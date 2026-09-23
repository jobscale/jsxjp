import { createApp, reactive, nextTick } from 'https://esm.sh/vue/dist/vue.esm-browser.js';
import { indexStore } from 'https://esm.sh/@jobscale/web-storage';

const formatTimestamp = (ts = Date.now(), withoutTimezone = false) => {
  const timestamp = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));
  if (withoutTimezone) return timestamp;
  return `${timestamp}+09:00`;
};

const conf = {
  esmList: [
    'https://esm.sh/@jobscale/web-storage',
    'https://esm.sh/@jobscale/create-logger',
    'https://esm.sh/@jobscale/loading',
  ],
};

let self = {
  nextId: 1,
  maxTargets: 20,
  maxHistory: 2000,
  methods: ['HEAD', 'GET', 'POST', 'OPTIONS'],
  uriSuggestions: [
    '/',
    '/favicon.ico',
    '/v1/img/loading.svg',
    'https://api.jsx.jp/auth/sign',
    'https://api.jsx.jp/api/speed',
    'https://fly.jsx.jp/auth/sign',
    'https://fly.jsx.jp/api/speed',
    'https://esm.sh/etc...',
    'https://cdn.jsdelivr.net/npm/vue/dist/vue.esm-browser.js',
    'https://cdnjs.cloudflare.com/ajax/libs/mqtt/5.16.0/mqtt.js',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap',
    'https://stg-front.jsx.jp/auth/sign',
    'https://stg-serverless.jsx.jp/auth/sign',
  ],
  targets: [],
  chartHover: {},
  hiddenTitle: false,

  createTarget(id) {
    return {
      id,
      method: self.methods[0],
      uri: self.uriSuggestions[0],
      interval: 3,
      running: 0, // 0: stopped, 1: running, 2: to be stopped
      error: '',
      history: [],
      detail: false,
    };
  },

  addTarget() {
    if (self.targets.length >= self.maxTargets) return;
    self.targets.push(self.createTarget(self.nextId++));
    nextTick(() => {
      document.querySelector('footer:last-of-type').scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    });
  },

  removeTarget(index) {
    const target = self.targets[index];
    self.stopTarget(target);
    self.targets.splice(index, 1);
  },

  toggleShowMode() {
    self.hiddenTitle = !self.hiddenTitle;
    nextTick(() => {
      if (self.hiddenTitle) {
        document.querySelector('section').scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      } else {
        document.querySelector('section:last-of-type').scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }
    });
  },

  startTarget(target) {
    target.interval = Math.max(1, Number.parseInt(target.interval, 10) || 1);
    target.running = 1;
    self.checkTarget(target);
  },

  stopTarget(target) {
    target.running = 2;
  },

  startOnce(target) {
    self.checkTarget(target, true);
  },

  toggleTarget(target) {
    if (target.running === 1) self.stopTarget(target);
    else self.startTarget(target);
  },

  async onSave() {
    const saved = { running: 0 };
    const targets = self.targets.map(item => ({ ...item, ...saved }));
    await indexStore.setItem('targets', targets);
  },

  async onBeforeunload() {
    await self.onSave();
  },

  async onPopstate() {
    await self.onSave();
  },

  async checkTarget(target, once = false) {
    if (!target.uri) return;
    if (target.running === 2) { target.running = 0; return; }
    target.error = '';
    const startedAt = performance.now();
    const timestamp = Date.now();
    const request = {
      method: target.method,
      cache: 'no-store',
    };
    if (target.method === 'POST') {
      request.headers = { 'Content-Type': 'application/json' };
      request.body = JSON.stringify({ timestamp });
    }
    const url = target.uri.match('esm.sh')
      ? conf.esmList[Math.floor(Math.random() * conf.esmList.length)]
      : target.uri;
    await fetch(url, { ...request })
    .then(async res => {
      if (!res.ok) throw new Error(`HTTP unsuccessful: ${res.status}`);
      return res;
    }).then(async res => {
      const body = await res.blob();
      const duration = Math.max(Math.round(performance.now() - startedAt), 1);
      const result = {
        id: `${timestamp}-${target.id}`,
        timestamp,
        duration,
        status: res.status,
        size: body.size,
        mbps: body.size * 8 / duration / 1000,
      };
      target.history.unshift(result);
      if (target.history.length > self.maxHistory) target.history.pop();
    }).catch(e => {
      target.error = e.message;
    });
    self.drawChart(target);
    if (target.running === 2) { target.running = 0; return; }
    if (target.running === 1 && !once) {
      setTimeout(() => self.checkTarget(target), target.interval * 1000);
    }
  },

  averageSpeed(target) {
    if (!target.history.length) return 'no data';
    const latest = target.history.slice(0, 10);
    const sumDuration = latest.reduce((prev, item) => prev + item.duration, 0);
    const sumMbps = latest.reduce((prev, item) => prev + item.mbps, 0);
    return `${(sumMbps / latest.length).toFixed(2)} Mbps (${Math.ceil(sumDuration / latest.length)} ms)`;
  },

  formatSpeed(item) {
    if (!item.size) return '-';
    return `${item.mbps.toFixed(2)} Mbps (${item.duration} ms)`;
  },

  formatDate(timestamp) {
    return formatTimestamp(timestamp, true);
  },

  badge(target) {
    const values = target.history.map(item => item.duration);
    const max = Math.max(...values, 1);
    return max > 10 ? max : '';
  },

  showChartTooltip(event, target) {
    if (!target.history.length) return;
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const index = Math.round((event.clientX - rect.left) / rect.width * (target.history.length - 1));
    const item = target.history[target.history.length - 1 - Math.max(0, Math.min(index, target.history.length - 1))];
    self.chartHover[target.id] = {
      item,
      left: event.clientX - rect.left,
    };
    nextTick(() => {
      const tooltip = canvas.previousElementSibling;
      if (!tooltip) return;
      const halfWidth = tooltip.offsetWidth / 2;
      const hover = self.chartHover[target.id];
      if (!hover) return;
      const boundedLeft = Math.max(halfWidth + 8, Math.min(hover.left, rect.width - halfWidth - 8));
      if (hover.left !== boundedLeft) hover.left = boundedLeft;
    });
  },

  hideChartTooltip(target) {
    delete self.chartHover[target.id];
  },

  drawChart(target) {
    const limited = 1500;
    const strokeColor = v => [
      { value: 300, color: '#8a6' },
      { value: 600, color: '#aa6' },
      { value: 900, color: '#f74' },
      { value: 1200, color: '#f20' },
      { value: 0, color: '#a00' },
    ].find(base => !base.value || v < base.value).color;
    const canvas = document.getElementById(`chart-${target.id}`);
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const { width } = canvas;
    const { height } = canvas;
    context.clearRect(0, 0, width, height);
    const values = target.history.map(item => item.duration).reverse();
    const max = Math.min(Math.max(...values, 1), limited);
    context.strokeStyle = '#3a484d';
    context.beginPath();
    context.moveTo(0, height - 1);
    context.lineTo(width, height - 1);
    context.stroke();
    if (!values.length) return;
    context.lineWidth = 3;
    const points = values.map((value, index) => {
      const num = value > limited ? limited : value;
      const x = values.length === 1 ? width / 2 : index * width / (values.length - 1);
      const y = height - 8 - num / max * (height - 20);
      return { x, y, value };
    });
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const feature = Math.max(start.value, end.value);
      context.strokeStyle = strokeColor(feature);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
  },
};
self = reactive(self);

createApp({
  setup() { return self; },
  async mounted() {
    self.targets = await indexStore.getItem('targets') ?? [];
    self.nextId = Math.max(0, ...self.targets.map(item => item.id)) + 1;
    if (!self.targets.length) self.addTarget();
    nextTick(() => {
      self.targets.forEach(target => self.drawChart(target));
    });
    window.addEventListener('beforeunload', event => self.onBeforeunload(event));
    window.addEventListener('popstate', () => self.onPopstate());
  },
}).mount('#app');
