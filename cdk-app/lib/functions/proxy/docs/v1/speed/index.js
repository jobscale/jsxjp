import { createApp, reactive, nextTick } from 'https://esm.sh/vue/dist/vue.esm-browser.js';
import { indexStore } from 'https://esm.sh/@jobscale/web-storage';
import { loading } from 'https://esm.sh/@jobscale/loading';
import { formatTimestamp } from 'https://esm.sh/@jobscale/timestamp';

const conf = {
  esmList: [
    'https://esm.sh/@jobscale/web-storage',
    'https://esm.sh/@jobscale/create-logger',
    'https://esm.sh/@jobscale/loading',
  ],
};

let self = {
  nextId: 1,
  router: '',
  maxTargets: 20,
  maxHistory: 2100,
  view: { type: [2100, 1800, 1500, 1200, 900, 600, 300], select: 0, chevron: false },
  methods: ['HEAD', 'GET', 'POST', 'OPTIONS'],
  uriSuggestions: [
    '/',
    '/favicon.ico',
    '/v1/img/loading.svg',
    '/auth/sign',
    '/api/speed',
    'https://api.jsx.jp/auth/sign',
    'https://api.jsx.jp/api/speed',
    'https://fly.jsx.jp/auth/sign',
    'https://fly.jsx.jp/api/speed',
    'https://stg.jsx.jp/auth/sign',
    'https://stg-api.jsx.jp/auth/sign',
    'https://esm.sh/etc...',
    'https://cdn.jsdelivr.net/npm/vue/dist/vue.esm-browser.js',
    'https://cdnjs.cloudflare.com/ajax/libs/mqtt/5.16.0/mqtt.js',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap',
  ],
  targets: [],
  chartHover: {},
  traffic: {
    earliest: 0,
  },
  hiddenTitle: false,

  createTarget(id) {
    return {
      id,
      method: self.methods[0],
      uri: self.uriSuggestions[0],
      interval: 6,
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

  startTargetReorder(event, target) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(target.id));
  },

  async dropTarget(event, target) {
    const draggedId = Number.parseInt(event.dataTransfer.getData('text/plain'), 10);
    const fromIndex = self.targets.findIndex(item => item.id === draggedId);
    const toIndex = self.targets.indexOf(target);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const [dragged] = self.targets.splice(fromIndex, 1);
    self.targets.splice(toIndex, 0, dragged);
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

  startAll() {
    loading(async () => {
      if (!self.targets.length) return;
      await self.stopAll();
      const delay = Math.floor(5_000 / self.targets.length);
      for (const [index, target] of self.targets.entries()) {
        if (index) await new Promise(resolve => { setTimeout(resolve, delay); });
        target.interval = 6;
        self.startTarget(target);
      }
    });
  },

  async stopAll() {
    for (const target of self.targets) {
      self.stopTarget(target);
    }
    const mem = {};
    while (true) {
      mem.stopped = 0;
      for (const target of self.targets) {
        if (target.running === 0) mem.stopped++;
      }
      if (mem.stopped === self.targets.length) break;
      await new Promise(resolve => { setTimeout(resolve, 500); });
    }
  },

  startTarget(target) {
    if (target.running) return;
    target.interval = Math.max(1, Number.parseInt(target.interval, 10) || 1);
    target.running = 1;
    self.checkTarget(target);
  },

  stopTarget(target) {
    loading(Promise.resolve());
    if (target.running !== 1) return;
    target.running = 2;
  },

  startOnce(target) {
    self.checkTarget(target, true);
  },

  toggleTarget(target) {
    if (target.running === 1) self.stopTarget(target);
    else self.startTarget(target);
  },

  async trafficGuard(ms) {
    const tick = Math.max(self.traffic.earliest - Date.now(), 0);
    self.traffic.earliest = Date.now() + tick + ms;
    await new Promise(resolve => { setTimeout(resolve, tick); });
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
    if (!target.uri) { target.running = 0; return; }
    await self.trafficGuard(300);
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
      target.error = e.cause?.message ?? e.message;
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
    const mbps = sumMbps ? `${(sumMbps / latest.length).toFixed(2)} Mbps`
    : `${latest[2]?.duration ?? ''} ${latest[1]?.duration ?? ''} ${latest[0].duration}`;
    return `${mbps} (${Math.ceil(sumDuration / latest.length)} ms)`;
  },

  formatSpeed(item) {
    if (!item.size) return '-';
    return `${item.mbps.toFixed(2)} Mbps (${item.duration} ms)`;
  },

  formatDate(ts) {
    return formatTimestamp({ ts, tz: false });
  },

  badge(target) {
    const values = target.history.map(item => item.duration);
    const max = Math.max(...values, 1);
    return max > 10 ? max : '';
  },

  viewType(hold) {
    if (hold) {
      self.view.select = self.view.select + hold;
      const limit = self.view.type.length - 1;
      if (self.view.select > limit) self.view.select = limit;
      if (self.view.select < 0) self.view.select = 0;
    } else {
      self.view.select = (self.view.select + 1) % self.view.type.length;
    }
    self.targets.forEach(target => self.drawChart(target));
    self.chartHover = {};
  },

  getViewHistory(target) {
    const num = self.view.type[self.view.select];
    return target.history.filter(v => v.duration).slice(0, num);
  },

  showChartTooltip(event, target) {
    const history = self.getViewHistory(target);
    if (!history.length) return;
    const canvas = event.currentTarget;
    const canvasRect = canvas.getBoundingClientRect();
    const chartRect = canvas.parentElement.getBoundingClientRect();
    const index = Math.round((event.clientX - canvasRect.left) / canvasRect.width * (history.length - 1));
    const item = history[history.length - 1 - Math.max(0, Math.min(index, history.length - 1))];
    self.chartHover[target.id] = {
      item,
      left: event.clientX - chartRect.left,
    };
    nextTick(() => {
      const tooltip = canvas.previousElementSibling;
      if (!tooltip) return;
      const halfWidth = tooltip.offsetWidth / 2;
      const hover = self.chartHover[target.id];
      if (!hover) return;
      const boundedLeft = Math.max(halfWidth + 8, Math.min(hover.left, chartRect.width - halfWidth - 8));
      if (hover.left !== boundedLeft) hover.left = boundedLeft;
    });
  },

  hideChartTooltip(target) {
    delete self.chartHover[target.id];
  },

  drawChart(target) {
    const limited = 1500;
    const strokeColor = v => [
      { color: 'hsla(80, 100%, 50%, 0.6)', value: 300 },
      { color: 'hsla(60, 100%, 50%, 0.7)', value: 600 },
      { color: 'hsla(40, 100%, 50%, 0.8)', value: 900 },
      { color: 'hsla(20, 100%, 50%, 0.9)', value: 1200 },
      { color: 'hsla(0, 100%, 50%, 1)', value: 0 },
    ].find(base => !base.value || v < base.value).color;
    const canvas = document.getElementById(`chart-${target.id}`);
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const { width } = canvas;
    const { height } = canvas;
    context.clearRect(0, 0, width, height);
    const history = self.getViewHistory(target);
    const values = history.map(item => item.duration).reverse();
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

  async getIntranet() {
    if (!window.getRouterTitle) return;
    self.router = await window.getRouterTitle();
  },

  goto(href) {
    Object.assign(location, { href });
  },
};
self = reactive(self);

createApp({
  setup() {
    return self;
  },

  async mounted() {
    self.targets = await indexStore.getItem('targets') ?? [];
    self.nextId = Math.max(0, ...self.targets.map(item => item.id)) + 1;
    if (!self.targets.length) self.addTarget();
    nextTick(() => {
      self.targets.forEach(target => self.drawChart(target));
    });
    window.addEventListener('beforeunload', event => self.onBeforeunload(event));
    window.addEventListener('popstate', () => self.onPopstate());
    document.body.style.visibility = 'inherit';
  },
}).mount('#app');
