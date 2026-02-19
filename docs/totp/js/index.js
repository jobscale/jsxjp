import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

let self = {
  token: '',
  list: [],
  status: '',
  loading: false,

  onSubmit() {
    if (self.token.length < 5) return;
    self.loading = true;
    logger.info('token', self.token);
    const params = ['/auth/totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: self.token }),
    }];
    self.status = '';
    self.list = [];
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(`${res.status} ${res.statusText}`);
      return res.json();
    })
    .then(({ list }) => {
      self.list = list;
    })
    .catch(e => {
      logger.error(e.message);
      self.status = e.message;
    })
    .then(() => setTimeout(() => { self.loading = false; }, 1000));
  },

  onCopyToClipboard(index) {
    if (!navigator.clipboard) return;
    if (!self.list[index].length) return;
    const clipboardRef = document.querySelector('main[name="clipboard"]');
    const el = clipboardRef[index];
    navigator.clipboard.writeText(self.list[index])
    .then(() => {
      el.classList.add('try-action');
      el.classList.add('fa-beat-fade');
      setTimeout(() => {
        el.classList.remove('try-action');
        el.classList.remove('fa-beat-fade');
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
    document.querySelector('input')?.focus();
  },
}).mount('#app');
