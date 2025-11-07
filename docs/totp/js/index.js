import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

const self = reactive({});

const Ocean = {
  token: '',
  list: [],
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
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .then(({ list }) => {
      self.list = list;
    })
    .catch(e => logger.error(e.message))
    .then(() => setTimeout(() => { self.loading = false; }, 1000));
  },

  onCopyToClipboard(index) {
    if (!navigator.clipboard) return;
    if (!self.list[index].length) return;
    const el = self.$refs.clipboard[index];
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

  onColorScheme() {
    const html = document.querySelector('html');
    html.classList.toggle('dark-scheme');
    html.classList.toggle('light-scheme');
  },
};

createApp({
  setup() {
    return Object.assign(self, Ocean);
  },

  async mounted() {
    setTimeout(() => self.$refs.token.focus(), 200);
  },
}).mount('#app');
