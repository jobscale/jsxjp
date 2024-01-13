/* global logger */

Vue.createApp({
  data() {
    return {
      login: '',
      password: '',
      statusText: '',
      auth: {
        allow: false,
        login: '',
        password: '',
        code: '',
        statusText: '',
      },
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
          this.auth.login = this.login;
          this.auth.password = this.password;
          this.auth.statusText = '';
          this.auth.allow = true;
          res.json().then(data => {
            const href = data?.href;
            if (href) document.location.href = href;
          });
          setTimeout(() => this.$refs.code.focus(), 200);
        }
      })
      .catch(e => logger.error(e.message))
      .then(() => setTimeout(() => {
        this.login = '';
        this.password = '';
        this.loading = false;
      }, 1000));
    },

    onSubmitAuth() {
      const { login, password, code } = this.auth;
      this.auth.statusText = '';
      this.loading = true;
      const params = ['/auth/login', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password, code }),
      }];
      fetch(...params)
      .then(res => {
        this.auth.statusText = `${res.status} ${res.statusText}`;
        if (res.status !== 200) {
          res.json().then(({ message }) => {
            this.auth.statusText += message;
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
        this.auth.code = '';
        this.loading = false;
      }, 1000));
    },
  },
}).mount('#app');
