import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

const Titan = {
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
    });
  },

  mounted() {
    logger.info('profile');
  },
}).mount('#app');
