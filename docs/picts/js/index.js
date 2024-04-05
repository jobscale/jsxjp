const logger = console;

Vue.createApp({
  data() {
    const tags = [
      { red: true }, { blue: true }, { green: false },
      { yellow: true }, { purple: true }, { pink: false },
      { gold: true }, { silver: true }, { peru: false },
    ];
    return {
      status: 'v0.12',
      signed: false,
      loading: true,
      refFiles: [],
      list: [],
      tags,
      imageTags: '{}',
      modify: '{}',
      preview: undefined,
    };
  },

  async mounted() {
    await this.sign();
    if (!this.list.length) {
      await this.find();
      await this.onLoad();
      this.check();
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
        if (res.status === 200) {
          this.signed = true;
          return;
        }
        document.location.href = '/auth';
      });
    },

    check() {
      const nowTags = {
        tags: Object.keys(this.tags),
        imageTags: {},
      };
      this.list.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      }).forEach(item => {
        nowTags.imageTags[item.name] = {
          tags: item.tags,
        };
      });
      this.modify = JSON.stringify(nowTags);
      return this.imageTags !== this.modify;
    },

    async onLoad() {
      const dataset = await this.getData([
        { name: 'tags' },
        { name: 'imageTags' },
      ]);
      this.tags = dataset.tags || [];
      this.modify = dataset.imageTags || {};
      this.imageTags = this.modify;
    },

    async onSave() {
      await this.putData({
        tags: this.tags,
        imageTags: this.modify,
      });
      this.imageTags = this.modify;
    },

    async find() {
      const params = ['find', {
        method: 'post',
        redirect: 'error',
      }];
      return fetch(...params)
      .then(res => {
        if (res.status !== 200) throw new Error(res.statusText);
        return res.json();
      })
      .then(({ images }) => {
        images.forEach(name => {
          this.list.unshift({
            name,
            tags: JSON.parse(JSON.stringify(this.tags)),
          });
        });
      })
      .catch(e => logger.error(e.message));
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
      return fetch(...params)
      .then(res => {
        if (res.status !== 200) throw new Error(res.statusText);
        return res.json();
      })
      .catch(e => logger.error(e.message));
    },

    wait(ms) {
      return new Promise(resolve => { setTimeout(resolve, ms); });
    },

    async onReadFile(event) {
      const { files } = event.target;
      if (!files) return;
      logger.info({ files });
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
      const item = await this.sanitizePicture(file, 0.7);
      return item;
    },

    async sanitizePicture(file, quality) {
      const prom = {};
      prom.pending = new Promise((resolve, reject) => {
        prom.resolve = resolve;
        prom.reject = reject;
      });
      const reader = new FileReader();
      const img = new Image();
      const canvas = document.createElement('canvas');
      reader.addEventListener('load', event => {
        img.src = event.target.result;
      });
      img.addEventListener('load', () => {
        // Assuming Live Photo duration is 3 seconds (adjust as needed)
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext('2d');
        // Draw the first frame of the Live Photo (static image)
        context.drawImage(img, 0, 0, img.width, img.height);
        // Convert canvas to blob and store it
        canvas.toBlob(blob => {
          const capture = new File([blob], file.name, { type: file.type });
          prom.resolve({
            img,
            file: file.size > capture.size ? capture : file,
          });
        }, file.type, quality);
      });
      reader.addEventListener('error', e => {
        prom.reject(e);
      });
      reader.readAsDataURL(file);
      return prom.pending;
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
        if (res.status !== 200) throw new Error(res.statusText);
        return res.json();
      })
      .catch(e => logger.error(e.message));
    },

    async onSubmit() {
      if (!this.$refs.file.files.length) return;
      this.loading = true;
      const filesList = Array.from(this.refFiles);
      for (const item of filesList) {
        await this.upload(item.file);
        const index = this.refFiles.findIndex(v => item.file.name === v.name);
        const [data] = this.refFiles.splice(index, 1);
        this.list.unshift({
          name: data.file.name,
          tags: JSON.parse(JSON.stringify(this.tags)),
        });
      }
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
        return res.json();
      })
      .catch(e => logger.error(e.message));
      this.loading = false;
    },

    async update(preview) {
      const item = this.list.find(v => v.name === preview.name);
      if (JSON.stringify(item) === JSON.stringify(preview)) return;
      item.tags = preview.tags;
    },

    async show(item) {
      if (item) {
        this.preview = JSON.parse(JSON.stringify(item));
      } else {
        const { preview } = this;
        this.preview = undefined;
        await this.update(preview);
        return;
      }
      this.loading = true;
      setTimeout(() => { this.loading = false; }, 1500);
    },

    onColorScheme() {
      const html = document.querySelector('html');
      html.classList.toggle('dark-scheme');
      html.classList.toggle('light-scheme');
    },
  },
}).mount('#app');
