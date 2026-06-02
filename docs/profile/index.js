import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

let self = {
  onColorScheme() {
    const html = document.documentElement;
    if (html.style.colorScheme === 'dark') {
      html.style.colorScheme = 'light';
      html.classList.toggle('light', true);
      html.classList.toggle('dark', false);
    } else if (html.style.colorScheme === 'light') {
      html.style.colorScheme = 'dark';
      html.classList.toggle('light', false);
      html.classList.toggle('dark', true);
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.style.colorScheme = isDark ? 'dark' : 'light';
      html.classList.toggle('light', !isDark);
      html.classList.toggle('dark', isDark);
    }
  },
};
self = reactive(self);

createApp({
  setup() {
    return self;
  },

  async mounted() {
    logger.info('profile');
    self.onColorScheme();
  },
}).mount('#app');
