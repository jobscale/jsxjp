const logger = console;

Vue.createApp({
  data() {
    return {
      signed: undefined,
      loading: true,
      popupText: '',
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

    onFind(rest) {
      const { id } = rest || {};
      this.loading = true;
      this.items = [];
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
          if (item.html.match(/github/)) return 'github';
          if (item.html.match(/xvideos/)) return 'xvideos';
          return 'shorten';
        };
        this.items = rows.map(item => ({
          ...item,
          tag: tag(item),
        }));
        this.onSort();
      })
      .catch(e => logger.error(e.message))
      .then(() => setTimeout(() => { this.loading = false; }, 1000));
    },

    onSort() {
      this.items = this.items.sort((a, b) => {
        const ta = new Date(a.lastAccess).getTime() || 0;
        const tb = new Date(b.lastAccess).getTime() || 0;
        return ta - tb;
      });
    },

    onCopy(event) {
      const { target: { parentElement: el } } = event;
      const { id } = el.dataset;
      const html = `${window.location.origin.replace(/https?:\/\//, '')}/s/${id}`;
      navigator.clipboard.writeText(html)
      .then(() => {
        this.showPopup('Shorten URL Copied', el);
      })
      .catch(e => logger.error(e.message));
    },

    showPopup(text, el) {
      clearTimeout(this.popupId);
      const { popup } = this.$refs;
      popup.style.opacity = '0';
      this.popupText = text;
      setTimeout(() => {
        const { left, right, top, bottom } = el.getBoundingClientRect();
        const x = (left + right) / 2;
        const y = top - (bottom - top);
        popup.style.left = `${x - (popup.offsetWidth / 2)}px`;
        popup.style.top = `${y - popup.offsetHeight}px`;
        popup.style.opacity = '100';
        this.popupId = setTimeout(() => {
          this.popupText = '';
        }, 2000);
      }, 100);
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
