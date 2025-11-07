import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

const self = reactive({});

const Ocean = {
  signed: undefined,
  password: '',
  confirm: '',
  statusText: '',
  loading: false,

  sign() {
    return fetch('/auth/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ href: '/account/password' }),
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
    const { password, confirm } = this;
    if (password !== confirm) {
      self.statusText = 'Mismatch Confirmation';
      return;
    }
    self.statusText = '';
    self.loading = true;
    const params = ['/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
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
      document.location.href = '/auth/logout';
    }, 1000));
  },
};

createApp({
  setup() {
    return Object.assign(self, Ocean);
  },

  mounted() {
    self.sign();
  },
}).mount('#app');
