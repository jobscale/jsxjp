const logger = console;

Vue.createApp({
  data() {
    return {
      status: 'v0.12',
      signed: false,
      loading: true,
      refFiles: [],
      list: [],
      tags: [
        { red: true }, { blue: true }, { green: false },
        { yellow: true }, { purple: true }, { pink: false },
        { gold: true }, { silver: true }, { peru: false },
      ],
      preview: undefined,
    };
  },

  async mounted() {
    await this.sign();
    if (!this.list.length) {
      await this.find();
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
        images.forEach(image => {
          this.list.unshift({
            name: image,
            tags: [
              { red: true }, { blue: true }, { green: false },
              { yellow: true }, { purple: true }, { pink: false },
              { gold: true }, { silver: true }, { peru: false },
            ],
          });
        });
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
      // eslint-disable-next-line no-restricted-syntax
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

    readFile(file) {
      return new Promise((resolve, reject) => {
        const { name, type, size } = file;
        const item = { name, type, size };
        if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(type)) {
          this.$refs.file.value = '';
          this.status += 'unsupported content type ';
          reject(new Error('unsupported content type'));
        }
        const MB = 8;
        const MAX_LENGTH = MB * 1024 * 1024;
        item.mb = `${Math.floor(size / 102400) / 10} mb`;
        if (size > MAX_LENGTH) {
          this.$refs.file.value = '';
          reject(new Error(`over content size ${JSON.stringify(item)}`));
        }
        const reader = new FileReader();
        reader.onerror = e => {
          this.status += `${e.message} `;
          reject(e);
        };
        reader.onload = res => {
          let binary = '';
          const buffer = new Uint8Array(res.target.result);
          for (let i = 0; i < buffer.length; i++) {
            binary += String.fromCharCode(buffer[i]);
          }
          const src = `data:${type};base64,${btoa(binary)}`;
          item.src = src;
          resolve(item);
        };
        reader.readAsArrayBuffer(file);
      });
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
      const filesList = Array.from(this.$refs.file.files);
      // eslint-disable-next-line no-restricted-syntax
      for (const file of filesList) {
        await this.upload(file);
        const index = this.refFiles.findIndex(item => file.name === item.name);
        const item = this.refFiles.splice(index, 1);
        this.list.unshift(...item);
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
