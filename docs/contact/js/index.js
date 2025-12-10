import { createApp, reactive, nextTick } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

const self = reactive({});

const Ocean = {
  image: undefined,
  secret: undefined,
  digit: '',
  subject: '',
  text: '',
  loading: true,
  status: '',

  onSubmit() {
    if (self.digit.length !== 4) {
      self.status = 'Failed';
      return;
    }
    self.loading = true;
    logger.info('digit', self.digit);
    const body = {
      secret: self.secret,
      digit: self.digit,
      content: {
        subject: self.subject,
        text: self.text,
      },
    };
    const params = ['/api/sendmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }];
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .then(() => {
      nextTick(() => {
        document.querySelector('div[name="text"]').textContent = '';
        self.digit = '';
        self.subject = '';
        self.status = 'Succeeded';
        self.getNumber();
        setTimeout(() => { self.status = ''; }, 15000);
      });
    })
    .catch(e => {
      logger.error(e.message);
      self.status = `Failed: ${e.message}`;
    })
    .then(() => setTimeout(() => { self.loading = false; }, 1000));
  },
  async getNumber() {
    const params = ['/api/getNumber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(''),
    }];
    await fetch(...params)
    .then(res => res.json())
    .catch(e => {
      logger.error(e.message);
      self.status = 'Failed';
    })
    .then(res => {
      self.image = res.image;
      self.secret = res.secret;
    });
  },
};

createApp({
  setup() {
    return Object.assign(self, Ocean);
  },

  async mounted() {
    await self.getNumber();
    await nextTick();
    setTimeout(() => {
      document.querySelector('input')?.focus();
      self.loading = false;
    }, 2000);
  },
}).mount('#app');
