const logger = console;

Vue.createApp({
  data() {
    return {};
  },

  mounted() {
    logger.info('profile');
  },

  methods: {
    onColorScheme() {
      const html = document.querySelector('html');
      html.classList.toggle('dark-scheme');
      html.classList.toggle('light-scheme');
    },
  },
}).mount('#app');
