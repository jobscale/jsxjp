const logger = console;

const sliceByDigit = (array, unit) => {
  const count = Math.ceil(array.length / unit);
  return new Array(count).fill()
  .map((_, i) => array.slice(unit * i, unit * (i + 1)));
};

Vue.createApp({
  data() {
    return {
      signed: false,
      loading: false,
      refFiles: [],
      list: [],
    };
  },

  async mounted() {
    await this.sign();
    if (!this.list.length) await this.find();
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
          });
        });
      })
      .catch(e => logger.error(e.message));
    },

    async onReadFile(event) {
      const { files } = event.target;
      if (!files) return;
      logger.info({ files });
      this.files = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const file of files) {
        await this.readFile(file)
        .catch(e => {
          logger.error(e);
        });
      }
      this.refFiles = files;
    },

    readFile(file) {
      return new Promise((resolve, reject) => {
        const { type, size } = file;
        if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(type)) {
          this.$refs.file.value = '';
          reject(new Error('unsupported content type'));
        }
        const MB = 5;
        const MAX_LENGTH = MB * 1024 * 1024; // 2MB
        if (size > MAX_LENGTH) {
          this.$refs.file.value = '';
          reject(new Error(`over content size ${JSON.stringify({ MB })}`));
        }
        const reader = new FileReader();
        reader.onerror = e => reject(e);
        reader.onload = res => {
          let binary = '';
          const buffer = new Uint8Array(res.target.result);
          for (let i = 0; i < buffer.length; i++) {
            binary += String.fromCharCode(buffer[i]);
          }
          const src = `data:${type};base64,${btoa(binary)}`;
          file.src = src;
          resolve();
        };
        reader.readAsArrayBuffer(file);
      });
    },

    async upload(files) {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
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
      const filesList = sliceByDigit(Array.from(this.$refs.file.files), 2);
      // eslint-disable-next-line no-restricted-syntax
      for (const files of filesList) {
        await this.upload(files);
      }
      Array.from(this.refFiles).forEach(item => {
        this.list.unshift({ name: item.name });
      });
      this.$refs.file.value = '';
      this.loading = false;
    },

    show(item, hide) {
      item.preview = hide ? -1 : (Number.parseInt(item.preview, 10) || 0) + 1;
    },

    onColorScheme() {
      const html = document.querySelector('html');
      html.classList.toggle('dark-scheme');
      html.classList.toggle('light-scheme');
    },
  },
}).mount('#app');
