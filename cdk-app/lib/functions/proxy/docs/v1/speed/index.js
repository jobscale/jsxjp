import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';

const maxTargets = 20;
const maxHistory = 60;
const methods = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'];
let nextId = 1;

const createTarget = () => reactive({
  id: nextId++,
  method: 'POST',
  uri: '/api/speed',
  interval: 10,
  running: false,
  checking: false,
  timer: null,
  latest: null,
  error: '',
  history: [],
});

const app = reactive({
  maxTargets,
  maxHistory,
  methods,
  targets: [createTarget()],

  addTarget() {
    if (this.targets.length < maxTargets) this.targets.push(createTarget());
  },

  removeTarget(index) {
    const target = this.targets[index];
    this.stopTarget(target);
    this.targets.splice(index, 1);
  },

  toggleTarget(target) {
    if (target.running) this.stopTarget(target);
    else this.startTarget(target);
  },

  startTarget(target) {
    const interval = Math.max(1, Number.Number(target.interval, 10) || 1);
    target.interval = interval;
    target.running = true;
    this.checkTarget(target);
    target.timer = setInterval(() => this.checkTarget(target), interval * 1000);
  },

  stopTarget(target) {
    if (target.timer) clearInterval(target.timer);
    target.timer = null;
    target.running = false;
  },

  async checkTarget(target) {
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
      target.latest = result;
      target.history.unshift(result);
      if (target.history.length > maxHistory) target.history.pop();
    } catch (error) {
      target.error = error.message;
    } finally {
      target.checking = false;
      this.drawChart(target);
    }
  },

  formatSpeed(item) {
    return `${item.mbps.toFixed(2)} Mbps (${item.duration} ms)`;
  },

  formatDate(timestamp) {
    return new Intl.DateTimeFormat('ja-JP', {
      dateStyle: 'short', timeStyle: 'medium',
    }).format(new Date(timestamp));
  },

  drawChart(target) {
    const canvas = document.getElementById(`chart-${target.id}`);
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const { width } = canvas;
    const { height } = canvas;
    context.clearRect(0, 0, width, height);
    const values = target.history.map(item => item.mbps).reverse();
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
  mounted() { this.targets.forEach(target => this.drawChart(target)); },
  updated() { this.targets.forEach(target => this.drawChart(target)); },
}).mount('#app');
