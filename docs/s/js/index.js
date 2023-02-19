const logger = console;

Vue.createApp({
  data() {
    return {
      id: undefined,
      url: '',
      shorten: 'https://jsx.jp/s/',
    };
  },

  methods: {
    generate() {
      if (this.url.length < 20) return;
      logger.info('url', this.url);
      const params = ['register', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: this.url }),
      }];
      fetch(...params)
      .then(res => res.json())
      .then(({ id }) => { this.shorten = `https://jsx.jp/s/${id}`; });
    },

    onColorScheme() {
      const html = document.querySelector('html');
      html.classList.toggle('dark-scheme');
      html.classList.toggle('light-scheme');
    },
  },
}).mount('#app');
