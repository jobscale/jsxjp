import { createApp, reactive } from 'https://esm.sh/vue/dist/vue.esm-browser.js';
import { logger } from 'https://esm.sh/@jobscale/create-logger';
import { fetchApi } from '/v1/js/fetch-api.js';

let self = {
  signed: undefined,
  password: '',
  confirm: '',
  statusText: '',
  loading: false,

  sign() {
    return fetchApi('/auth/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ href: '/v1/account/password/' }),
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

  onSubmit() {
    const { password, confirm } = self;
    if (password !== confirm) {
      self.statusText = 'Mismatch Confirmation';
      return;
    }
    self.statusText = '';
    self.loading = true;
    fetchApi('/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    .then(res => {
      self.statusText = `${res.status} ${res.statusText}`;
      if (res.status !== 200) {
        res.json().then(({ message }) => {
          self.statusText += message;
          throw new Error(res.statusText);
        });
      }
    })
    .catch(e => logger.error(e.message))
    .then(() => setTimeout(() => {
      document.location.href = '/auth/logout';
    }, 1000));
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
    document.querySelector('input')?.focus();
  },
}).mount('#app');
