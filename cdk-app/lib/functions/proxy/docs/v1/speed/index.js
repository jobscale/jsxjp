import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';

const maxTargets = 20;
const maxHistory = 2000;
const methods = ['HEAD', 'GET', 'POST', 'OPTIONS'];
const uriSuggestions = [
  '/',
  '/favicon.ico',
  '/v1/img/loading.svg',
  '/auth/sign',
  '/api/speed',
  'https://stg-front.jsx.jp/auth/sign',
];

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

const createTarget = id => reactive({
  id,
  method: methods[0],
  uri: uriSuggestions[0],
  interval: 3,
  running: false,
  checking: false,
  error: '',
  history: [],
});

const app = reactive({
  nextId: 1,
  maxTargets,
  maxHistory,
  methods,
  uriSuggestions,
  targets: [],

  addTarget() {
    if (app.targets.length < maxTargets) app.targets.push(createTarget(app.nextId++));
  },

  removeTarget(index) {
    const target = app.targets[index];
    app.stopTarget(target);
    app.targets.splice(index, 1);
  },

  toggleTarget(target) {
    if (target.running) app.stopTarget(target);
    else app.startTarget(target);
  },

  startTarget(target) {
    const interval = Math.max(1, Number.parseInt(target.interval, 10) || 1);
    target.interval = interval;
    target.running = true;
    app.checkTarget(target);
  },

  stopTarget(target) {
    target.running = false;
  },

  async checkTarget(target, once = false) {
    if (target.checking || !target.uri) return;
    target.checking = true;
    target.error = '';
    const startedAt = performance.now();
    const timestamp = Date.now();
    try {
      const request = {
        method: target.method,
        cache: 'no-store',
      };
      if (target.method === 'POST') {
        request.headers = { 'Content-Type': 'application/json' };
        request.body = JSON.stringify({ timestamp });
      }
      const response = await fetch(target.uri, {
        ...request,
      });
      if (!response.ok) throw new Error(`HTTP unsuccessful: ${response.status}`);
      const body = await response.blob();
      const duration = Math.max(Math.round(performance.now() - startedAt), 1);
      const result = {
        id: `${timestamp}-${target.id}`,
        timestamp,
        duration,
        status: response.status,
        size: body.size,
        mbps: body.size * 8 / duration / 1000,
      };
      target.history.unshift(result);
      if (target.history.length > maxHistory) target.history.pop();
    } catch (e) {
      target.error = e.message;
    } finally {
      target.checking = false;
      app.drawChart(target);
    }
    if (target.running && !once) {
      setTimeout(() => app.checkTarget(target), target.interval * 1000);
    }
  },

  averageSpeed(target) {
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

  drawChart(target) {
    const canvas = document.getElementById(`chart-${target.id}`);
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const { width } = canvas;
    const { height } = canvas;
    context.clearRect(0, 0, width, height);
    const values = target.history.map(item => item.duration).reverse();
    const max = Math.max(...values, 1);
    context.strokeStyle = '#3a484d';
    context.beginPath();
    context.moveTo(0, height - 1);
    context.lineTo(width, height - 1);
    context.stroke();
    if (!values.length) return;
    context.strokeStyle = '#f2b84b';
    context.lineWidth = 3;
    context.beginPath();
    values.forEach((value, index) => {
      const x = values.length === 1 ? width / 2 : index * width / (values.length - 1);
      const y = height - 8 - value / max * (height - 20);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  },
});

createApp({
  setup() { return app; },
  mounted() {
    app.addTarget();
    app.targets.forEach(target => app.drawChart(target));
  },
}).mount('#app');
