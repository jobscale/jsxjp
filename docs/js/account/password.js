/* global logger */

Vue.createApp({
  data() {
    return {
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
        body: JSON.stringify({ href: '/account/password' }),
      })
      .then(res => {
        if (res.status === 200) return;
        document.location.href = '/auth';
      });
    },

    onSubmit() {
      const { password, confirm } = this;
      if (password !== confirm) {
        this.statusText = 'Mismatch Confirmation';
        return;
      }
      this.statusText = '';
      this.loading = true;
      const params = ['/account/password', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
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
        document.location.href = '/auth/logout';
      }, 1000));
    },
  },
}).mount('#app');
