import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

const self = reactive({
  login: '',
  password: '',
  statusText: '',
  auth: {
    allow: false,
    login: '',
    password: '',
    code: '',
    statusText: '',
  },
  loading: false,

  onSubmit() {
    const { login, password } = self;
    self.statusText = '';
    self.loading = true;
    const params = ['/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    }];
    fetch(...params)
    .then(res => {
      self.statusText = `${res.status} ${res.statusText}`;
      if (res.status !== 200) {
        res.json().then(({ message }) => {
          self.statusText += message;
          throw new Error(res.statusText);
        });
      } else {
        self.auth.login = self.login;
        self.auth.password = self.password;
        self.auth.statusText = '';
        self.auth.allow = true;
        res.json().then(data => {
          const href = data?.href;
          if (href) document.location.href = href;
        });
        setTimeout(() => document.querySelector('input[name="code"]').focus(), 200);
      }
    })
    .catch(e => logger.error(e.message))
    .then(() => setTimeout(() => {
      self.login = '';
      self.password = '';
      self.loading = false;
    }, 1000));
  },

  onSubmitAuth() {
    const { login, password, code } = self.auth;
    self.auth.statusText = '';
    self.loading = true;
    const params = ['/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password, code }),
    }];
    fetch(...params)
    .then(res => {
      self.auth.statusText = `${res.status} ${res.statusText}`;
      if (res.status !== 200) {
        res.json().then(({ message }) => {
          self.auth.statusText += message;
          throw new Error(res.statusText);
        });
      } else {
        res.json().then(({ href }) => {
          document.location.href = href;
        });
      }
    })
    .catch(e => logger.error(e.message))
    .then(() => setTimeout(() => {
      self.auth.code = '';
      self.loading = false;
    }, 1000));
  },
});

createApp({
  setup() {
    return self;
  },
}).mount('#app');
