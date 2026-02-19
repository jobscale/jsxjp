import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import html2canvas from 'https://esm.sh/html2canvas@1.4.1';

const logger = console;

let self = {
  list: [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
  ],
  fontKey: 'font-Mochiy-Pop-P-One',
  fonts: [
    { name: 'Mochiy Pop P One', class: 'font-Mochiy-Pop-P-One' },
    { name: 'Monomaniac One', class: 'font-Monomaniac-One' },
    { name: 'Zen Kurenaido', class: 'font-Zen-Kurenaido' },
    { name: 'Yusei Magic', class: 'font-Yusei-Magic' },
    { name: '教科書体', class: 'font-book' },
    { name: 'sans-serif', class: 'font-sans-serif' },
    { name: 'system', class: 'font-system' },
    { name: 'Tangerine', class: 'font-tangerine' },
    { name: 'ゴシック体', class: 'font-gothic' },
    { name: '明朝体', class: 'font-mincho' },
    { name: '手書き風', class: 'font-hand' },
  ],
  fontSize: 'font-size: 25pt;',
  sizeList: [],

  async saveAsPNG(el) {
    const { name } = el.dataset;
    const canvas = await html2canvas(el, {
      backgroundColor: null,
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${name.replace(':', '_')}.png`;
    link.click();
    await new Promise(resolve => { setTimeout(resolve, 200); });
    link.remove();
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
    for (let i = 10; i < 55; i++) {
      self.sizeList.push({
        name: `font-size-${i}`, style: `font-size: ${i}pt;`,
      });
    }
  },
};
self = reactive(self);

createApp({
  setup() {
    return self;
  },

  async mounted() {
    logger.info('Start application');
    await self.start();
  },
}).mount('#app');
