import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

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
  return `${timestamp}+9`;
};

const self = reactive({
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
    return fetch('/auth/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ href: '/s/list' }),
    })
    .then(res => {
      if (res.status !== 200) throw new Error('denied');
      return res.json();
    })
    .then(payload => {
      self.signed = payload;
    })
    .catch(() => {
      document.location.href = '/auth';
    });
  },

  onFind(rest) {
    const { id } = rest || {};
    self.loading = true;
    self.items = [];
    const params = ['../find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }];
    fetch(...params)
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
    .catch(e => logger.error(e.message))
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
    const { target: { parentElement: el } } = event;
    const { id } = el.dataset;
    const html = `${window.location.origin.replace(/https?:\/\//, '')}/s/${id}`;
    navigator.clipboard.writeText(html)
    .then(() => {
      self.showPopup('Shorten URL Copied', el);
    })
    .catch(e => logger.error(e.message));
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
    const { target: { parentElement: el } } = event;
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
    const params = ['../remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }];
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .catch(e => logger.error(e.message))
    .then(() => self.onFind());
  },

  onColorScheme() {
    const html = document.querySelector('html');
    html.classList.toggle('dark-scheme');
    html.classList.toggle('light-scheme');
  },
});

createApp({
  setup() {
    return self;
  },

  async mounted() {
    await self.sign();
    self.onFind();
  },
}).mount('#app');
