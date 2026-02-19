import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

let self = {
  onColorScheme() {
    const html = document.querySelector('html');
    html.classList.toggle('dark-scheme');
    html.classList.toggle('light-scheme');
  },
};
self = reactive(self);

createApp({
  setup() {
    return self;
  },

  async mounted() {
    logger.info('profile');
  },
}).mount('#app');
