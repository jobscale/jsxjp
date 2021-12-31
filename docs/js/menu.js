/* eslint-env browser */
/* global App */
class Menu extends App {
  navigation(event) {
    event.preventDefault();
    document.body.classList.toggle('nav-open');
  }

  logout(event) {
    event.preventDefault();
    const see = this.loading();
    this.logoutInternal()
    .catch(e => logger.error(e.message))
    .then(() => see)
    .then(() => this.loading(true));
  }

  async logoutInternal() {
    return this.fetch('/auth/logout', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        credentials: 'omit',
      },
    })
    .then(() => {
      document.location.href = '';
    });
  }

  trigger() {
    document.logout = () => this.logoutInternal();
    document.querySelector('#logout')
    .addEventListener('click', event => this.logout(event));
    document.querySelector('.nav-trigger')
    .addEventListener('click', event => this.navigation(event));
  }
}

setTimeout(() => {
  new Menu().trigger();
}, 1000);
