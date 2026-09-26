import { createApp, reactive } from 'https://esm.sh/vue/dist/vue.esm-browser.js';
import { logger } from 'https://esm.sh/@jobscale/create-logger';
import { formatTimestamp } from '/v1/js/timestamp.js';
import { fetchApi } from '/v1/js/fetch-api.js';

let self = {
  signed: undefined,
  loading: true,
  popupText: '',
  items: [],
  confirmation: {
    ok: () => {},
    cancel: () => {},
    title: undefined,
    message: undefined,
    show: false,
  },

  showTS(ts) {
    if (!ts || Number.isNaN(new Date(ts).getTime())) return '';
    return formatTimestamp(ts, true);
  },

  sign() {
    return fetchApi('/auth/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ href: '/v1/s/list/' }),
    })
    .then(res => {
      if (res.status !== 200) throw new Error('denied');
      return res.json();
    })
    .then(payload => {
      self.signed = payload;
    })
    .catch(() => {
      document.location.href = '/v1/auth/';
    });
  },

  onFind(rest) {
    const { id } = rest || {};
    self.loading = true;
    self.items = [];
    fetchApi('/s/find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .then(({ rows }) => {
      const tag = item => {
        if (!item.html) return 'personal';
        if (item.html.match(/github/)) return 'github';
        if (item.html.match(/xvideos/)) return 'xvideos';
        return 'shorten';
      };
      self.items = rows.map(item => ({
        ...item,
        tag: tag(item),
      }));
      self.onSort();
    })
    .catch(e => logger.error(e.cause?.message ?? e.cause ?? e.message))
    .then(() => setTimeout(() => { self.loading = false; }, 1000));
  },

  onSort() {
    self.items = self.items.sort((a, b) => {
      const ta = new Date(a.lastAccess).getTime() || 0;
      const tb = new Date(b.lastAccess).getTime() || 0;
      return ta - tb;
    });
  },

  onCopy(event) {
    const { currentTarget: el } = event;
    const { id } = el.dataset;
    const html = `${window.location.origin.replace(/https?:\/\//, '')}/s/${id}`;
    navigator.clipboard.writeText(html)
    .then(() => {
      self.showPopup('Shorten URL Copied', el);
    })
    .catch(e => logger.error(e.cause?.message ?? e.cause ?? e.message));
  },

  showPopup(text, el) {
    clearTimeout(self.popupId);
    const popupRef = document.querySelector('div[name="popup"]');
    popupRef.style.opacity = '0';
    self.popupText = text;
    setTimeout(() => {
      const { left, right, top, bottom } = el.getBoundingClientRect();
      const x = (left + right) / 2;
      const y = top - (bottom - top);
      popupRef.style.left = `${x - popupRef.offsetWidth / 2}px`;
      popupRef.style.top = `${y - popupRef.offsetHeight}px`;
      popupRef.style.opacity = '1';
      self.popupRefId = setTimeout(() => {
        popupRef.style.opacity = '0';
        self.popupRefText = '';
      }, 2000);
    }, 100);
  },

  onRemove(event) {
    const { currentTarget: el } = event;
    const { id } = el.dataset;
    el.parentElement.parentElement.style.opacity = '0.3';
    logger.info({ id });
    self.confirmation.title = 'Are you remove this item?';
    self.confirmation.message = `Be trying to remove item "${id}".<br>Are you sure?`;
    self.confirmation.ok = () => {
      logger.info({ run: 'OK' });
      self.removeId({ id });
      self.confirmation.show = false;
    };
    self.confirmation.cancel = () => {
      logger.info({ run: 'Cancel' });
      el.parentElement.parentElement.style.opacity = '1';
      self.confirmation.show = false;
    };
    self.confirmation.show = true;
  },

  removeId({ id }) {
    self.loading = true;
    fetchApi('/s/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .catch(e => logger.error(e.cause?.message ?? e.cause ?? e.message))
    .then(() => self.onFind());
  },

  onColorScheme() {
    const html = document.documentElement;
    const current = html.style.colorScheme;
    const next = current ? current === 'dark' ? 'light' : 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    html.style.colorScheme = next;
    html.dataset.theme = next;
  },
};
self = reactive(self);

createApp({
  setup() {
    return self;
  },

  async mounted() {
    self.onColorScheme();
    await self.sign();
    self.onFind();
  },
}).mount('#app');
