/* global mqtt */
import { createApp, reactive, nextTick } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { createLogger } from 'https://esm.sh/@jobscale/create-logger';
import { loading } from 'https://esm.sh/@jobscale/loading';

const customStorage = {
  enc: new TextEncoder(),
  dec: new TextDecoder(),
  DATABASE: 'SecureDB',
  TABLE: 'SecureStore',
  PASSWORD: '<secret>',

  async secretProvider() {
    customStorage.PASSWORD = `2026:${location.hostname.split('.').reverse().join('.')}:custom-storage`;
  },

  async gzip(data) {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(data);
    writer.close();
    return new Response(cs.readable).arrayBuffer();
  },

  async gunzip(data) {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(data);
    writer.close();
    return new Response(ds.readable).arrayBuffer();
  },

  async deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw', customStorage.enc.encode(password), 'PBKDF2', false, ['deriveKey'],
    );
    return crypto.subtle.deriveKey({
      name: 'PBKDF2', salt, iterations: 10_000, hash: 'SHA-256',
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  },

  async encrypt(value) {
    const data = customStorage.enc.encode(JSON.stringify(value));
    const compressed = new Uint8Array(await customStorage.gzip(data));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    if (customStorage.PASSWORD === '<secret>') await customStorage.secretProvider();
    const key = await customStorage.deriveKey(customStorage.PASSWORD, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, compressed,
    );
    const obfuscatedSalt = salt.map((v, i) => v ^ (i + 0xb) % 0xdb);
    return new Blob([obfuscatedSalt, iv, encrypted]);
  },

  async decrypt(blob) {
    const combined = new Uint8Array(await blob.arrayBuffer());
    const obfuscatedSalt = combined.subarray(0, 16);
    const iv = combined.subarray(16, 16 + 12);
    const data = combined.subarray(16 + 12);
    const salt = new Uint8Array(obfuscatedSalt.map((v, i) => v ^ (i + 0xb) % 0xdb));
    if (customStorage.PASSWORD === '<secret>') await customStorage.secretProvider(false);
    const key = await customStorage.deriveKey(customStorage.PASSWORD, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, data,
    );
    const value = await customStorage.gunzip(new Uint8Array(decrypted));
    return JSON.parse(customStorage.dec.decode(value));
  },

  async init() {
    if (customStorage.db) return customStorage.db;
    customStorage.db = new Promise((resolve, reject) => {
      const req = indexedDB.open(customStorage.DATABASE, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(customStorage.TABLE)) {
          db.createObjectStore(customStorage.TABLE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return customStorage.db;
  },

  async setItem(key, value) {
    if (location.protocol.endsWith('http:')) {
      localStorage.setItem(key, JSON.stringify(value));
      return undefined;
    }
    const db = await customStorage.init();
    const encrypted = await customStorage.encrypt(value);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(customStorage.TABLE, 'readwrite');
      const store = tx.objectStore(customStorage.TABLE);
      const req = store.put(encrypted, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },

  async getItem(key) {
    return Promise.resolve().then(async () => {
      if (location.protocol.endsWith('http:')) {
        const raw = localStorage.getItem(key);
        if (raw === null) return undefined;
        return JSON.parse(raw);
      }
      const decode = encrypted => {
        if (!encrypted) return undefined;
        return customStorage.decrypt(encrypted).catch(() => undefined);
      };
      const db = await customStorage.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(customStorage.TABLE, 'readonly');
        const store = tx.objectStore(customStorage.TABLE);
        const req = store.get(key);
        req.onsuccess = () => resolve(decode(req.result));
        req.onerror = () => reject(req.error);
      });
    })
    .catch(() => undefined);
  },

  async removeItem(key) {
    if (location.protocol.endsWith('http:')) {
      localStorage.removeItem(key);
      return undefined;
    }
    const db = await customStorage.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(customStorage.TABLE, 'readwrite');
      const store = tx.objectStore(customStorage.TABLE);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },

  async clear() {
    if (location.protocol.endsWith('http:')) {
      localStorage.clear();
      return undefined;
    }
    const db = await customStorage.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(customStorage.TABLE, 'readwrite');
      const store = tx.objectStore(customStorage.TABLE);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },
};

const random = (length = 7) => {
  const bytes = crypto.getRandomValues(new Uint8Array(length)).reduce((acc, byte) => `${acc}${byte.toString(16).padStart(2, '0')}`, '');
  const num = BigInt(`0x${bytes}`);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const r = BigInt(chars.length);
  let result = '';
  let n = num;
  while (n > 0n) {
    result = `${chars[Number.parseInt(n % r, 10)]}${result}`;
    n /= r;
  }
  return result.slice(-length);
};

const formatTimestamp = (ts = Date.now(), withoutTimezone = false) => {
  const timestamp = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));
  if (withoutTimezone) return timestamp;
  return `${timestamp}+09:00`;
};

const version = 'v=0.5';
const client = mqtt.connect('wss://mqtt.jsx.jp/mqtt');
const publish = payload => {
  const topic = `chat/logs-${version}/speak`;
  client.publish(topic, JSON.stringify({
    ...payload,
    time: formatTimestamp(),
    userId: 'browser',
    name: 'browser',
    id: random(6),
  }));
};

const logger = createLogger('debug', {
  callback: (...args) => {
    publish({ message: args.map(arg => JSON.stringify(arg)).join(' ') });
  },
});

const strictEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const deepClone = obj => JSON.parse(JSON.stringify(obj));

let self = {
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
  preview: undefined,
  editTags: [],
  cacheImage: {},
  message: [],

  sign() {
    return fetch('/auth/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ href: '/v1/picts/' }),
    })
    .then(res => {
      if (res.status !== 200) throw new Error('denied');
      return res.json();
    })
    .then(payload => {
      self.signed = payload;
    })
    .catch(() => {
      document.location.href = '/v1/auth/';
    });
  },

  async onLoad() {
    const { tags, imageTags } = await self.getData([
      { name: 'tags' },
      { name: 'imageTags' },
    ]) ?? {};
    self.tags = tags ?? {};
    self.updateImageTags(imageTags ?? {});
    const { searchParams } = new URL(window.location.href);
    if (searchParams.has('t')) {
      decodeURIComponent(searchParams.get('t')).split(',').forEach(key => {
        if (self.tags[key] === undefined) return;
        self.tags[key] = true;
      });
    }
    self.modify = deepClone(self.imageTags);
  },

  async onSave() {
    const tags = {};
    Object.keys(self.tags).forEach(key => { tags[key] = false; });
    await self.putData({
      tags,
      imageTags: self.imageTags,
    });
  },

  updateImageTags(input) {
    const imageTags = deepClone(input);
    [...self.list, ...self.preList].forEach(item => {
      self.imageTags[item.name] = { tags: {} };
      Object.keys(self.tags).forEach(key => {
        self.imageTags[item.name].tags[key] = imageTags[item.name]?.tags?.[key] || false;
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
    const editTags = self.editTags
    .map(tag => tag.trim()).filter(Boolean);
    self.editTags = [];
    const tags = {};
    editTags.forEach(key => {
      tags[key] = !!self.tags[key];
    });
    if (!strictEqual(tags, self.tags)) {
      self.tags = tags;
      self.updateImageTags(self.modify);
      await self.onSave();
    }
  },

  async find() {
    const params = ['/picts/find', {
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

  async loadNextBatch() {
    if (!self.preList.length) return;
    const nextItems = self.preList.splice(0, 1);
    for (const item of nextItems) {
      const imagePath = `/picts/t/${item.name}`;
      const cacheImage = self.isPC && await customStorage.getItem(imagePath);
      if (cacheImage) {
        item.thumbnail = cacheImage;
        continue;
      }
      item.thumbnail = await self.loadImage(imagePath)
      .then(async image => {
        if (self.isPC) await customStorage.setItem(imagePath, image);
        return image;
      })
      .catch(() => `/picts/t/${item.name}`);
    }
    self.list.unshift(...nextItems);
    self.updateImageTags(self.imageTags);
    nextItems.forEach(item => {
      if (!self.modify[item.name]) {
        self.modify[item.name] = deepClone(self.imageTags[item.name]);
      }
    });
  },

  async getData(list) {
    const params = ['/picts/getData', {
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
    .catch(e => {
      logger.error(e.message);
      self.message.push(e.message);
    });
  },

  async putData(dataset) {
    const params = ['/picts/putData', {
      method: 'POST',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataset),
    }];
    return loading(fetch(...params))
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .catch(e => {
      logger.error(e.message);
      self.message.push(e.message);
    });
  },

  async onReadFile(event) {
    const { files } = event.currentTarget;
    if (!files) return;
    self.refFiles = [];
    self.status = `${files.length} `;
    const preUpload = async () => {
      for (const file of files) {
        await self.readFile(file)
        .then(item => self.refFiles.push(item))
        .catch(e => {
          logger.error(e);
          self.message.push(e.message);
        });
      }
    };
    await loading(preUpload)
    .catch(e => {
      logger.error(e.message);
      self.message.push(e.message);
    });
  },

  async readFile(file) {
    const ALLOW = [
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    ];
    if (!ALLOW.includes(file.type)) {
      const fileRef = document.querySelector('input[name="file"]');
      fileRef.value = '';
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
      img.src = event.currentTarget.result;
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
          height: Math.round(height * max / width),
        };
      }
      return {
        width: Math.round(width * max / height),
        height: max,
      };
    }
    return { width, height };
  },

  async upload(file) {
    const formData = new FormData();
    formData.append('files', file);
    const params = ['/picts/upload', {
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
    const fileRef = document.querySelector('input[name="file"]');
    if (!fileRef.files.length) return;
    self.loading = true;
    self.modify = deepClone(self.imageTags);
    for (const item of [...self.refFiles]) {
      await self.upload(item.file)
      .catch(e => {
        logger.error(e.message);
        self.message.push(e.message);
      });
      const index = self.refFiles.findIndex(v => item.file.name === v.name);
      const [data] = self.refFiles.splice(index, 1);
      const { name } = data.file;
      self.modify[name] = { tags: deepClone(self.tags) };
      self.status = self.refFiles.length.toLocaleString();
      await new Promise(resolve => { setTimeout(resolve, 200); });
      const exist = self.list.find(l => l.name === name);
      if (!exist) self.preList.unshift({ name });
    }
    self.loadNextBatch();
    if (!strictEqual(self.modify, self.imageTags)) {
      self.updateImageTags(self.modify);
      await self.onSave();
    }
    fileRef.value = '';
    self.refFiles = [];
    self.loading = false;
  },

  async remove() {
    if (!self.preview) return;
    self.loading = true;
    const { preview } = self;
    const params = ['/picts/remove', {
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
      nextTick(() => {
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

  async showImage(target) {
    if (!target) return;
    const { name } = target;
    const imagePath = `i/${name}`;
    if (self.cacheImage[imagePath]) {
      target.imgUrl = self.cacheImage[imagePath];
      return;
    }
    const cacheImage = self.isPC && await customStorage.getItem(imagePath)
    .catch(e => logger.error(e.message));
    if (cacheImage) {
      target.imgUrl = cacheImage;
      self.cacheImage[imagePath] = cacheImage;
      return;
    }
    loading(new Promise(resolve => { setTimeout(resolve, 500); }));
    self.loadImage(`/picts/${imagePath}`)
    .catch(() => self.loadImage(`/picts/t/${name}`))
    .then(async imgUrl => {
      target.imgUrl = imgUrl;
      self.cacheImage[imagePath] = imgUrl;
      if (navigator.storage?.estimate) {
        navigator.storage.estimate().then(estimate => {
          const usageMB = (estimate.usage / 1024 / 1024).toFixed(2);
          const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
          logger.info(`use: ${usageMB} MB / max: ${quotaMB} MB`);
        });
      }
      if (self.isPC) customStorage.setItem(imagePath, imgUrl);
    })
    .catch(e => {
      logger.error(e.message);
      target.imgError = e.message;
    });
  },

  async hidden() {
    self.modify = Object.fromEntries(Object.entries(self.modify).map(([n, opts]) => [
      n,
      { tags: Object.fromEntries(Object.entries(opts.tags).filter(([, enabled]) => enabled)) },
    ]));
    const imageTags = Object.fromEntries(Object.entries(self.imageTags).map(([n, opts]) => [
      n,
      { tags: Object.fromEntries(Object.entries(opts.tags).filter(([, enabled]) => enabled)) },
    ]));
    if (!strictEqual(self.modify, imageTags)) {
      self.updateImageTags(self.modify);
      await self.onSave();
    }
    self.preview = undefined;
    nextTick(() => {
      window.scrollTo(0, self.scrollY);
    });
  },

  async show(item) {
    if (!item) {
      self.hidden();
      return;
    }

    self.modify = deepClone(self.imageTags);
    self.scrollY = window.scrollY;
    self.preview = item;
    self.showImage(item);
  },

  onShowNext() {
    const { name } = self.preview;
    const index = self.list.findIndex(item => item.name === name);
    self.preview = self.list[index + 1 >= self.list.length ? 0 : index + 1];
    self.showImage(self.preview);
  },

  onShowPrev() {
    const { name } = self.preview;
    const index = self.list.findIndex(item => item.name === name);
    self.preview = self.list[index < 1 ? self.list.length - 1 : index - 1];
    self.showImage(self.preview);
  },

  get isPC() {
    if (!navigator?.userAgentData) return false;
    const { mobile: isMobile } = navigator.userAgentData;
    if (isMobile) return false;
    const { platform } = navigator.userAgentData;
    const platformList = ['Linux', 'macOS', 'Windows'];
    const isPC = platformList.includes(platform);
    if (!isPC) return false;
    const { brands } = navigator.userAgentData;
    const brandList = ['Google Chrome'];
    const isAllow = brands.some(b => brandList.includes(b.brand));
    if (!isAllow) return false;
    return true;
  },

  onColorScheme() {
    const html = document.documentElement;
    const current = html.style.colorScheme;
    const next = current ? current === 'dark' ? 'light' : 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    html.style.colorScheme = next;
    html.dataset.theme = next;
  },
};
self = reactive(self);

createApp({
  setup() {
    return self;
  },

  async mounted() {
    self.onColorScheme();
    await self.sign();
    if (!self.list.length) {
      await self.find();
      await self.onLoad();
      setTimeout(() => { self.loading = false; }, 500);
    }
  },
}).mount('#app');
