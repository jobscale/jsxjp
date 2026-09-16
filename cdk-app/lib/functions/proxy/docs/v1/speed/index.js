import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';

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

const app = reactive({
  nextId: 1,
  maxTargets: 20,
  maxHistory: 2000,
  methods: ['HEAD', 'GET', 'POST', 'OPTIONS'],
  uriSuggestions: [
    '/',
    '/favicon.ico',
    '/v1/img/loading.svg',
    '/auth/sign',
    '/api/speed',
    'https://esm.sh/@jobscale/create-logger',
    'https://esm.sh/@jobscale/loading',
    'https://stg-front.jsx.jp/auth/sign',
    'https://stg-serverless.jsx.jp/auth/sign',
  ],
  targets: [],

  createTarget(id) {
    return {
      id,
      method: app.methods[0],
      uri: app.uriSuggestions[0],
      interval: 3,
      running: false,
      error: '',
      history: [],
      detail: false,
    };
  },

  addTarget() {
    if (app.targets.length < app.maxTargets) app.targets.push(app.createTarget(app.nextId++));
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
    if (!target.uri) return;
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
      if (target.history.length > app.maxHistory) target.history.pop();
    } catch (e) {
      target.error = e.message;
    } finally {
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

  maximum(target) {
    const values = target.history.map(item => item.duration);
    const max = Math.max(...values, 1);
    return max > 10 ? max : '';
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
    context.lineWidth = 3;
    const points = values.map((value, index) => {
      const x = values.length === 1 ? width / 2 : index * width / (values.length - 1);
      const y = height - 8 - value / max * (height - 20);
      return { x, y, value };
    });
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const feature = Math.max(start.value, end.value);
      context.strokeStyle = feature < 500 ? '#aa6' : feature < 1000 ? '#f74' : '#f20';
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
  },
});

createApp({
  setup() { return app; },
  mounted() {
    app.addTarget();
    app.targets.forEach(target => app.drawChart(target));
  },
}).mount('#app');
