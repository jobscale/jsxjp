import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import html2canvas from 'https://esm.sh/html2canvas@1.4.1';

const logger = console;

const self = reactive({});

const Ocean = {
  list: [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
  ],

  async saveAsPNG(el) {
    const fname = el.dataset.name;
    const canvas = await html2canvas(el, {
      backgroundColor: null,
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${fname}.png`;
    link.click();
  },

  async action() {
    logger.info('action');
    const spanList = document.querySelectorAll('.img');
    for (const span of spanList) {
      await self.saveAsPNG(span);
    }
  },

  async start() {
    logger.info('start');
  },
};

createApp({
  setup() {
    return Object.assign(self, Ocean);
  },

  mounted() {
    self.start();
  },
}).mount('#app');
