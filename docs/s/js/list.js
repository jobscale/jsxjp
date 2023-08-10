const logger = console;

Vue.createApp({
  data() {
    return {
      signed: false,
      loading: true,
      items: [],
      confirmation: {
        ok: () => {},
        cancel: () => {},
        title: undefined,
        message: undefined,
        show: false,
      },
    };
  },

  async mounted() {
    await this.sign();
    this.onFind();
  },

  methods: {
    sign() {
      return fetch('/auth/sign', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ href: '/s/list' }),
      })
      .then(res => {
        if (res.status === 200) {
          this.signed = true;
          return;
        }
        document.location.href = '/auth';
      });
    },

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
          return item.html.match(/github/) ? 'github' : 'shorten';
        };
        this.items = rows.map(item => ({
          ...item,
          tag: tag(item),
        }));
      })
      .catch(e => logger.error(e.message))
      .then(() => setTimeout(() => { this.loading = false; }, 1000));
    },

    onRemove(event) {
      const { target: { parentElement: el } } = event;
      const { id } = el.dataset;
      el.parentElement.parentElement.style = 'opacity: 0.3';
      logger.info({ id });
      this.confirmation.title = 'Are you remove this item?';
      this.confirmation.message = `Be trying to remove item "${id}".<br>Are you sure?`;
      this.confirmation.ok = () => {
        logger.info({ run: 'OK' });
        this.removeId({ id });
        this.confirmation.show = false;
      };
      this.confirmation.cancel = () => {
        logger.info({ run: 'Cancel' });
        this.confirmation.show = false;
      };
      this.confirmation.show = true;
    },

    removeId({ id }) {
      this.loading = true;
      const params = ['../remove', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }];
      fetch(...params)
      .then(res => {
        if (res.status !== 200) throw new Error(res.statusText);
        return res.json();
      })
      .catch(e => logger.error(e.message))
      .then(() => this.onFind());
    },

    onColorScheme() {
      const html = document.querySelector('html');
      html.classList.toggle('dark-scheme');
      html.classList.toggle('light-scheme');
    },
  },
}).mount('#app');
