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
  return `${timestamp}+09:00`;
};

let self = {
  signed: undefined,
  url: '',
  shorten: '',
  registerAt: '',
  status: '',
  loading: false,

  sign() {
    return fetch('/auth/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ href: '/s' }),
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

  onSubmit() {
    if (self.url.length < 20) return;
    self.loading = true;
    logger.info('url', self.url);
    const params = ['register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: self.url }),
    }];
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .then(item => {
      self.registerAt = formatTimestamp(item.registerAt, true);
      self.shorten = `jsx.jp/s/${item.id}`;
      self.url = '';
    })
    .catch(e => {
      self.status = e.message;
      logger.error(e.message);
    })
    .then(() => setTimeout(() => { self.loading = false; }, 1000));
  },

  onCopyToClipboard() {
    if (!navigator.clipboard) return;
    if (!self.shorten.length) return;
    navigator.clipboard.writeText(self.shorten)
    .then(() => {
      const clipboardRef = document.querySelector('main[name="clipboard"]');
      clipboardRef.classList.add('try-action');
      clipboardRef.classList.add('fa-beat-fade');
      setTimeout(() => {
        clipboardRef.classList.remove('try-action');
        clipboardRef.classList.remove('fa-beat-fade');
      }, 2500);
      logger.debug('Copied to clipboard');
    })
    .catch(e => logger.error(e.message));
  },
};
self = reactive(self);

createApp({
  setup() {
    return self;
  },

  async mounted() {
    await self.sign();
    document.querySelector('input')?.focus();
  },
}).mount('#app');
