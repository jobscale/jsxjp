import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

const self = reactive({
  signed: undefined,
  login: '',
  password: '',
  confirm: '',
  role: 'guest',
  statusText: '',
  loading: false,

  sign() {
    return fetch('/auth/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ href: '/user/reset' }),
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
    const { login, password, confirm, role } = self;
    if (password !== confirm) {
      self.statusText = 'Mismatch Confirmation';
      return;
    }
    self.statusText = '';
    self.loading = true;
    const params = ['/user/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password, role }),
    }];
    fetch(...params)
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
      self.login = '';
      self.password = '';
      self.confirm = '';
      self.loading = false;
    }, 1000));
  },
});

createApp({
  setup() {
    return self;
  },

  async mounted() {
    await self.sign();
    const params = new URLSearchParams(location.search);
    self.login = params.get('l') ?? '';
    document.querySelectorAll('input')[self.login ? 1 : 0]?.focus();
  },
}).mount('#app');
