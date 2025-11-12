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
  fontKey: 'font-Mochiy-Pop-P-One',
  fonts: [
    { name: 'Mochiy Pop P One', class: 'font-Mochiy-Pop-P-One' },
    { name: 'Monomaniac One', class: 'font-Monomaniac-One' },
    { name: '教科書体', class: 'font-book' },
    { name: 'sans-serif', class: 'font-sans-serif' },
    { name: 'system', class: 'font-system' },
    { name: 'Tangerine', class: 'font-tangerine' },
    { name: 'ゴシック体', class: 'font-gothic' },
    { name: '明朝体', class: 'font-mincho' },
    { name: '手書き風', class: 'font-hand' },
  ],
  fontSize: 'font-size-25',
  sizeList: [
    { name: 'size-18', class: 'font-size-18' },
    { name: 'size-19', class: 'font-size-19' },
    { name: 'size-20', class: 'font-size-20' },
    { name: 'size-21', class: 'font-size-21' },
    { name: 'size-22', class: 'font-size-22' },
    { name: 'size-23', class: 'font-size-23' },
    { name: 'size-24', class: 'font-size-24' },
    { name: 'size-25', class: 'font-size-25' },
    { name: 'size-26', class: 'font-size-26' },
    { name: 'size-27', class: 'font-size-27' },
    { name: 'size-28', class: 'font-size-28' },
    { name: 'size-29', class: 'font-size-29' },
    { name: 'size-30', class: 'font-size-30' },
    { name: 'size-31', class: 'font-size-31' },
    { name: 'size-32', class: 'font-size-32' },
    { name: 'size-33', class: 'font-size-33' },
    { name: 'size-34', class: 'font-size-34' },
    { name: 'size-35', class: 'font-size-35' },
    { name: 'size-36', class: 'font-size-36' },
    { name: 'size-37', class: 'font-size-37' },
    { name: 'size-38', class: 'font-size-38' },
    { name: 'size-39', class: 'font-size-39' },
    { name: 'size-40', class: 'font-size-40' },
    { name: 'size-41', class: 'font-size-41' },
    { name: 'size-42', class: 'font-size-42' },
    { name: 'size-43', class: 'font-size-43' },
    { name: 'size-44', class: 'font-size-44' },
  ],

  async saveAsPNG(el) {
    const fname = el.dataset.name;
    const canvas = await html2canvas(el, {
      backgroundColor: null,
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${fname.replace(':', '_')}.png`;
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
  },
};

createApp({
  setup() {
    return Object.assign(self, Ocean);
  },

  mounted() {
    logger.info('Start application');
    self.start();
  },
}).mount('#app');
