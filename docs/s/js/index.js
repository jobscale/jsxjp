const logger = console;

Vue.createApp({
  data() {
    return {
      url: '',
      shorten: '',
      loading: false,
    };
  },

  methods: {
    generate() {
      if (this.url.length < 20) return;
      this.loading = true;
      logger.info('url', this.url);
      const params = ['register', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: this.url }),
      }];
      fetch(...params)
      .then(res => res.json())
      .then(({ id }) => { this.shorten = `https://jsx.jp/s/${id}`; })
      .then(() => { this.loading = false; });
    },

    onColorScheme() {
      const html = document.querySelector('html');
      html.classList.toggle('dark-scheme');
      html.classList.toggle('light-scheme');
    },
  },
}).mount('#app');
