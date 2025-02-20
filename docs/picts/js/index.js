/* global mqtt */

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

const { createLogger } = window.logger;
const logger = createLogger('debug', {
  callback: ({ recipe }) => {
    publish({ message: recipe.map(v => JSON.stringify(v)).join(' ') });
  },
});

const wait = ms => new Promise(resolve => { setTimeout(resolve, ms); });
const strictEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const deepClone = obj => JSON.parse(JSON.stringify(obj));

Vue.createApp({
  data() {
    return {
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
    };
  },

  async mounted() {
    await this.sign();
    if (!this.list.length) {
      await this.find();
      await this.onLoad();
      setTimeout(() => { this.loading = false; }, 500);
    }
  },

  methods: {
    sign() {
      return fetch('/auth/sign', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ href: '/picts' }),
      })
      .then(res => {
        if (res.status !== 200) throw new Error('denied');
        return res.json();
      })
      .then(payload => {
        this.signed = payload;
      })
      .catch(() => {
        document.location.href = '/auth';
      });
    },

    async onLoad() {
      const { tags, imageTags } = (await this.getData([
        { name: 'tags' },
        { name: 'imageTags' },
      ])) || {};
      this.tags = tags || {};
      this.updateImageTags(imageTags || {});
      const { searchParams } = new URL(window.location.href);
      if (searchParams.has('t')) {
        decodeURIComponent(searchParams.get('t')).split(',').forEach(key => {
          if (this.tags[key] === undefined) return;
          this.tags[key] = true;
        });
      }
      this.modify = deepClone(this.imageTags);
    },

    async onSave(tags) {
      if (tags) {
        Object.keys(tags).forEach(key => {
          this.tags[key] = this.tags[key] || false;
        });
      } else if (strictEqual(this.modify, this.imageTags)) return;
      this.updateImageTags(this.modify);
      tags = {};
      Object.keys(this.tags).forEach(key => { tags[key] = false; });
      await this.putData({
        tags,
        imageTags: this.imageTags,
      });
    },

    updateImageTags(input) {
      const imageTags = deepClone(input);
      this.list.forEach(item => {
        this.imageTags[item.name] = { tags: {} };
        Object.keys(this.tags).forEach(key => {
          this.imageTags[item.name].tags[key] = imageTags[item.name].tags[key] || false;
        });
      });
    },

    itemShown(item) {
      const enabled = Object.keys(this.tags).filter(key => this.tags[key]);
      if (!enabled.length) return '';
      for (const key of enabled) {
        if (this.imageTags[item.name]?.tags[key]) return '';
      }
      return 'hide';
    },

    onEdit() {
      this.editTags = Object.keys(this.tags);
      if (!Object.keys(this.editTags).length) this.onAddTag();
    },

    onAddTag() {
      this.editTags.push('');
    },

    onRemoveTag(index) {
      this.editTags.splice(index, 1);
    },

    async onCloseTag() {
      const editTags = this.editTags.filter(v => v);
      const tags = {};
      editTags.forEach(key => {
        tags[key] = !!this.tags[key];
      });
      if (!strictEqual(tags, this.tags)) {
        await this.onSave(tags);
      }
      this.editTags = [];
    },

    async find() {
      const params = ['find', {
        method: 'post',
        redirect: 'error',
      }];
      this.list.length = 0;
      this.preList.length = 0;
      return fetch(...params)
      .then(res => {
        if (res.status !== 200) throw new Error(res.statusText);
        return res.json();
      })
      .then(({ images }) => {
        images.forEach(name => {
          this.preList.unshift({ name });
        });
        this.loadNextBatch();
      })
      .catch(e => logger.error(e.message));
    },

    onImageLoad() {
      this.loadNextBatch();
    },

    loadNextBatch() {
      if (!this.preList.length) return;
      const nextItems = this.preList.splice(0, 1);
      this.list.push(...nextItems);
    },

    async getData(list) {
      const params = ['getData', {
        method: 'post',
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
        method: 'post',
        redirect: 'error',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataset),
      }];
      this.loading = true;
      return fetch(...params)
      .then(res => {
        if (res.status !== 200) throw new Error(res.statusText);
        this.loading = false;
        return res.json();
      })
      .catch(e => logger.error(e.message));
    },

    async onReadFile(event) {
      const { files } = event.target;
      if (!files) return;
      this.refFiles = [];
      this.status = `${files.length} `;
      for (const file of files) {
        await this.readFile(file)
        .then(item => {
          this.refFiles.push(item);
        })
        .catch(e => {
          this.status += `${e.message} `;
          logger.error(e);
        });
      }
    },

    async readFile(file) {
      const ALLOW = [
        'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      ];
      if (!ALLOW.includes(file.type)) {
        this.$refs.file.value = '';
        this.status += 'unsupported content type ';
        throw new Error('unsupported content type');
      }
      const item = await this.sanitizePicture(file, 0.6);
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
        const { width, height } = this.adjustSize(img.width, img.height, 2048);
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
        method: 'post',
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
      if (!this.$refs.file.files.length) return;
      this.loading = true;
      this.modify = deepClone(this.imageTags);
      const list = [];
      for (const item of [...this.refFiles]) {
        await this.upload(item.file)
        .catch(e => {
          logger.error(e.message);
          this.status = e.message;
        });
        const index = this.refFiles.findIndex(v => item.file.name === v.name);
        const [data] = this.refFiles.splice(index, 1);
        const { name } = data.file;
        this.modify[name] = { tags: this.tags };
        this.status = this.refFiles.length.toLocaleString();
        await wait(200);
        list.unshift({ name });
      }
      this.list.unshift(...list);
      await this.onSave();
      this.$refs.file.value = '';
      this.refFiles = [];
      this.loading = false;
    },

    async remove() {
      if (!this.preview) return;
      this.loading = true;
      const { preview } = this;
      const params = ['remove', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: preview.name }),
        redirect: 'error',
      }];
      await fetch(...params)
      .then(res => {
        if (res.status !== 200) throw new Error(res.statusText);
        const index = this.list.findIndex(item => item.name === preview.name);
        this.list.splice(index, 1);
        this.preview = undefined;
        this.$nextTick(() => {
          window.scrollTo(0, this.scrollY);
        });
        return res.json();
      })
      .catch(e => logger.error(e.message));
      this.loading = false;
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
      const { name } = this.preview;
      const imagePath = `i/${name}`;
      if (this.cacheImage[imagePath]) {
        this.preview.imgUrl = this.cacheImage[imagePath];
        return;
      }
      this.loading = true;
      this.loadImage(imagePath)
      .catch(() => this.loadImage(`t/${name}`))
      .then(imgUrl => {
        this.preview.imgUrl = imgUrl;
        this.cacheImage[imagePath] = imgUrl;
      })
      .catch(e => {
        logger.error(e.message);
        this.showMessage = e.message;
      })
      .then(() => {
        this.loading = false;
      });
    },

    async show(item) {
      if (!item) {
        await this.onSave();
        this.preview = undefined;
        this.$nextTick(() => {
          window.scrollTo(0, this.scrollY);
        });
        return;
      }
      this.scrollY = window.scrollY;
      this.showMessage = 'Now Loading...';
      this.preview = item;
      this.showImage();
    },

    onShowNext() {
      const { name } = this.preview;
      const index = this.list.findIndex(item => item.name === name);
      this.preview = this.list[index + 1 >= this.list.length ? 0 : index + 1];
      this.showImage();
    },

    onShowPrev() {
      const { name } = this.preview;
      const index = this.list.findIndex(item => item.name === name);
      this.preview = this.list[index < 1 ? this.list.length - 1 : index - 1];
      this.showImage();
    },

    onColorScheme() {
      const html = document.querySelector('html');
      html.classList.toggle('dark-scheme');
      html.classList.toggle('light-scheme');
    },
  },
}).mount('#app');
