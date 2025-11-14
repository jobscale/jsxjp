/* global mqtt */
import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { createLogger } from 'https://esm.sh/@jobscale/logger';

const version = 'v=0.5';
const client = mqtt.connect('wss://mqtt.jsx.jp/mqtt');
const publish = payload => {
  const topic = `chat/logs-${version}/speak`;
  client.publish(topic, JSON.stringify({
    ...payload,
    time: new Date().toISOString(),
    userId: 'browser',
    name: 'browser',
    id: Math.floor(Date.now() % 10000),
  }));
};

const logger = createLogger('debug', {
  callback: ({ recipe }) => {
    publish({ message: recipe.map(v => JSON.stringify(v)).join(' ') });
  },
});

const strictEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const deepClone = obj => JSON.parse(JSON.stringify(obj));

const self = reactive({});

const Ocean = {
  version,
  status: version,
  signed: {},
  loading: true,
  refFiles: [],
  preList: [],
  list: [],
  tags: {},
  imageTags: {},
  modify: {},
  showMessage: '',
  preview: undefined,
  editTags: [],
  cacheImage: {},

  sign() {
    return fetch('/auth/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ href: '/picts' }),
    })
    .then(res => {
      if (res.status !== 200) throw new Error('denied');
      return res.json();
    })
    .then(payload => {
      self.signed = payload;
    })
    .catch(() => {
      document.location.href = '/auth';
    });
  },

  async onLoad() {
    const { tags, imageTags } = (await self.getData([
      { name: 'tags' },
      { name: 'imageTags' },
    ])) || {};
    self.tags = tags || {};
    self.updateImageTags(imageTags || {});
    const { searchParams } = new URL(window.location.href);
    if (searchParams.has('t')) {
      decodeURIComponent(searchParams.get('t')).split(',').forEach(key => {
        if (self.tags[key] === undefined) return;
        self.tags[key] = true;
      });
    }
    self.modify = deepClone(self.imageTags);
  },

  async onSave(tags) {
    if (tags) {
      Object.keys(tags).forEach(key => {
        self.tags[key] = self.tags[key] || false;
      });
    } else if (strictEqual(self.modify, self.imageTags)) return;
    self.updateImageTags(self.modify);
    tags = {};
    Object.keys(self.tags).forEach(key => { tags[key] = false; });
    await self.putData({
      tags,
      imageTags: self.imageTags,
    });
  },

  updateImageTags(input) {
    const imageTags = deepClone(input);
    self.list.forEach(item => {
      self.imageTags[item.name] = { tags: {} };
      Object.keys(self.tags).forEach(key => {
        self.imageTags[item.name].tags[key] = imageTags[item.name].tags[key] || false;
      });
    });
  },

  itemShown(item) {
    const enabled = Object.keys(self.tags).filter(key => self.tags[key]);
    if (!enabled.length) return '';
    for (const key of enabled) {
      if (self.imageTags[item.name]?.tags[key]) return '';
    }
    return 'hide';
  },

  onEdit() {
    self.editTags = Object.keys(self.tags);
    if (!Object.keys(self.editTags).length) self.onAddTag();
  },

  onAddTag() {
    self.editTags.push('');
  },

  onRemoveTag(index) {
    self.editTags.splice(index, 1);
  },

  async onCloseTag() {
    const editTags = self.editTags.filter(Number);
    const tags = {};
    editTags.forEach(key => {
      tags[key] = !!self.tags[key];
    });
    if (!strictEqual(tags, self.tags)) {
      await self.onSave(tags);
    }
    self.editTags = [];
  },

  async find() {
    const params = ['find', {
      method: 'POST',
      redirect: 'error',
    }];
    self.list.length = 0;
    self.preList.length = 0;
    return fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .then(({ images }) => {
      images.forEach(name => {
        self.preList.unshift({ name });
      });
      self.loadNextBatch();
    })
    .catch(e => logger.error(e.message));
  },

  onImageLoad() {
    self.loadNextBatch();
  },

  loadNextBatch() {
    if (!self.preList.length) return;
    const nextItems = self.preList.splice(0, 1);
    self.list.push(...nextItems);
  },

  async getData(list) {
    const params = ['getData', {
      method: 'POST',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    }];
    return fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .catch(e => logger.error(e.message));
  },

  async putData(dataset) {
    const params = ['putData', {
      method: 'POST',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataset),
    }];
    self.loading = true;
    return fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      self.loading = false;
      return res.json();
    })
    .catch(e => logger.error(e.message));
  },

  async onReadFile(event) {
    const { files } = event.target;
    if (!files) return;
    self.refFiles = [];
    self.status = `${files.length} `;
    for (const file of files) {
      await self.readFile(file)
      .then(item => {
        self.refFiles.push(item);
      })
      .catch(e => {
        self.status += `${e.message} `;
        logger.error(e);
      });
    }
  },

  async readFile(file) {
    const ALLOW = [
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    ];
    if (!ALLOW.includes(file.type)) {
      self.$refs.file.value = '';
      self.status += 'unsupported content type ';
      throw new Error('unsupported content type');
    }
    const item = await self.sanitizePicture(file, 0.6);
    return item;
  },

  async sanitizePicture(file, quality) {
    const prom = {};
    prom.pending = new Promise((...argv) => { [prom.resolve, prom.reject] = argv; });
    const reader = new FileReader();
    const img = new Image();
    const canvas = document.createElement('canvas');
    reader.addEventListener('load', event => {
      img.src = event.target.result;
    });
    img.addEventListener('load', () => {
      const { width, height } = self.adjustSize(img.width, img.height, 2048);
      // Assuming Live Photo duration is 3 seconds (adjust as needed)
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      // Draw the first frame of the Live Photo (static image)
      context.drawImage(img, 0, 0, width, height);
      // Convert canvas to blob and store it
      canvas.toBlob(blob => {
        const capture = new File([blob], file.name, { type: file.type });
        const selected = file.size > capture.size ? capture : file;
        logger.debug(`${file.name}
original ${(file.size / 1000).toLocaleString()}
toBlob ${(capture.size / 1000).toLocaleString()}`);
        prom.resolve({ img, file: selected });
      }, file.type, quality);
    });
    reader.addEventListener('error', e => {
      logger.error(e.message);
      prom.reject(e);
    });
    reader.readAsDataURL(file);
    return prom.pending;
  },

  adjustSize(width, height, max) {
    if (width > max || height > max) {
      if (width > height) {
        return {
          width: max,
          height: Math.round((height * max) / width),
        };
      }
      return {
        width: Math.round((width * max) / height),
        height: max,
      };
    }
    return { width, height };
  },

  async upload(file) {
    const formData = new FormData();
    formData.append('files', file);
    const params = ['upload', {
      method: 'POST',
      redirect: 'error',
      body: formData,
    }];
    await fetch(...params)
    .then(res => {
      logger.debug({ 'upload fetch status': res.status });
      if (res.status !== 200) throw new Error(`${res.status} ${res.statusText}`);
      return res.json();
    });
  },

  async onSubmit() {
    if (!self.$refs.file.files.length) return;
    self.loading = true;
    self.modify = deepClone(self.imageTags);
    const list = [];
    for (const item of [...self.refFiles]) {
      await self.upload(item.file)
      .catch(e => {
        logger.error(e.message);
        self.status = e.message;
      });
      const index = self.refFiles.findIndex(v => item.file.name === v.name);
      const [data] = self.refFiles.splice(index, 1);
      const { name } = data.file;
      self.modify[name] = { tags: self.tags };
      self.status = self.refFiles.length.toLocaleString();
      await new Promise(resolve => { setTimeout(resolve, 200); });
      list.unshift({ name });
    }
    self.list.unshift(...list);
    await self.onSave();
    self.$refs.file.value = '';
    self.refFiles = [];
    self.loading = false;
  },

  async remove() {
    if (!self.preview) return;
    self.loading = true;
    const { preview } = self;
    const params = ['remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: preview.name }),
      redirect: 'error',
    }];
    await fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      const index = self.list.findIndex(item => item.name === preview.name);
      self.list.splice(index, 1);
      self.preview = undefined;
      self.$nextTick(() => {
        window.scrollTo(0, self.scrollY);
      });
      return res.json();
    })
    .catch(e => logger.error(e.message));
    self.loading = false;
  },

  loadImage(url) {
    return fetch(url)
    .then(res => {
      if (res.status !== 200) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      return res.blob();
    })
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
  },

  async showImage() {
    const { name } = self.preview;
    const imagePath = `i/${name}`;
    if (self.cacheImage[imagePath]) {
      self.preview.imgUrl = self.cacheImage[imagePath];
      return;
    }
    self.loading = true;
    self.loadImage(imagePath)
    .catch(() => self.loadImage(`t/${name}`))
    .then(imgUrl => {
      self.preview.imgUrl = imgUrl;
      self.cacheImage[imagePath] = imgUrl;
    })
    .catch(e => {
      logger.error(e.message);
      self.showMessage = e.message;
    })
    .then(() => {
      self.loading = false;
    });
  },

  async show(item) {
    if (!item) {
      await self.onSave();
      self.preview = undefined;
      self.$nextTick(() => {
        window.scrollTo(0, self.scrollY);
      });
      return;
    }
    self.scrollY = window.scrollY;
    self.showMessage = 'Now Loading...';
    self.preview = item;
    self.showImage();
  },

  onShowNext() {
    const { name } = self.preview;
    const index = self.list.findIndex(item => item.name === name);
    self.preview = self.list[index + 1 >= self.list.length ? 0 : index + 1];
    self.showImage();
  },

  onShowPrev() {
    const { name } = self.preview;
    const index = self.list.findIndex(item => item.name === name);
    self.preview = self.list[index < 1 ? self.list.length - 1 : index - 1];
    self.showImage();
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
    await self.sign();
    if (!self.list.length) {
      await self.find();
      await self.onLoad();
      setTimeout(() => { self.loading = false; }, 500);
    }
  },
}).mount('#app');
