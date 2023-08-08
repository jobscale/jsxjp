/* global logger */

Vue.createApp({
  data() {
    return {
      login: '',
      password: '',
      statusText: '',
      loading: false,
    };
  },

  methods: {
    onSubmit() {
      const { login, password } = this;
      this.statusText = '';
      this.loading = true;
      const params = ['/auth/login', {
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
        } else {
          res.json().then(({ href }) => {
            document.location.href = href;
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
