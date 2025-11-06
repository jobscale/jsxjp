import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

const Titan = {
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
      this.signed = payload;
    })
    .catch(() => {
      document.location.href = '/auth';
    });
  },

  onSubmit() {
    if (this.url.length < 20) return;
    this.loading = true;
    logger.info('url', this.url);
    const params = ['register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: this.url }),
    }];
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .then(({ id }) => {
      this.shorten = `jsx.jp/s/${id}`;
    })
    .catch(e => logger.error(e.message))
    .then(() => setTimeout(() => { this.loading = false; }, 1000));
  },

  onCopyToClipboard() {
    if (!navigator.clipboard) return;
    if (!this.shorten.length) return;
    navigator.clipboard.writeText(this.shorten)
    .then(() => {
      this.$refs.clipboard.classList.add('try-action');
      this.$refs.clipboard.classList.add('fa-beat-fade');
      setTimeout(() => {
        this.$refs.clipboard.classList.remove('try-action');
        this.$refs.clipboard.classList.remove('fa-beat-fade');
      }, 2500);
      logger.debug('Copied to clipboard');
    })
    .catch(e => logger.error(e.message));
  },

  onColorScheme() {
    const html = document.querySelector('html');
    html.classList.toggle('dark-scheme');
    html.classList.toggle('light-scheme');
  },
};

createApp({
  setup() {
    return reactive({
      ...Titan,
      signed: undefined,
      url: '',
      shorten: '',
      loading: false,
    });
  },

  async mounted() {
    await this.sign();
    this.$refs.url.focus();
  },
}).mount('#app');
