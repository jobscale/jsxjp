/* global logger */

Vue.createApp({
  data() {
    return {
      signed: false,
      login: '',
      password: '',
      confirm: '',
      statusText: '',
      loading: false,
    };
  },

  mounted() {
    this.sign();
  },

  methods: {
    sign() {
      fetch('/auth/sign', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ href: '/user/reset' }),
      })
      .then(res => {
        if (res.status === 200) {
          this.signed = true;
          return;
        }
        document.location.href = '/auth';
      });
    },

    onSubmit() {
      const { login, password, confirm } = this;
      if (password !== confirm) {
        this.statusText = 'Mismatch Confirmation';
        return;
      }
      this.statusText = '';
      this.loading = true;
      const params = ['/user/reset', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      }];
      fetch(...params)
      .then(res => {
        this.statusText = `${res.status} ${res.statusText}`;
        if (res.status !== 200) {
          res.json().then(({ message }) => {
            this.statusText += message;
            throw new Error(res.statusText);
          });
        }
      })
      .catch(e => logger.error(e.message))
      .then(() => setTimeout(() => {
        this.login = '';
        this.password = '';
        this.confirm = '';
        this.loading = false;
      }, 1000));
    },
  },
}).mount('#app');
