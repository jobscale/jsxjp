const logger = console;

Vue.createApp({
  data() {
    return {
      loading: true,
      items: [],
    };
  },

  mounted() {
    this.onFind();
  },

  methods: {
    onFind(rest) {
      const { id } = rest || {};
      this.loading = true;
      const params = ['../find', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }];
      fetch(...params)
      .then(res => {
        if (res.status !== 200) throw new Error(res.statusText);
        return res.json();
      })
      .then(({ rows }) => {
        const tag = item => {
          if (!item.html) return 'personal';
          return item.html.match(/github/) ? 'github' : 'work';
        };
        this.items = rows.map(item => ({
          ...item,
          tag: tag(item),
        }));
      })
      .catch(e => logger.error(e.message))
      .then(() => setTimeout(() => { this.loading = false; }, 1000));
    },

    onColorScheme() {
      const html = document.querySelector('html');
      html.classList.toggle('dark-scheme');
      html.classList.toggle('light-scheme');
    },
  },
}).mount('#app');
