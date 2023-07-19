/* global logger */

class Menu {
  navigation(event) {
    event.preventDefault();
    document.body.classList.toggle('nav-open');
  }

  wait(ms) {
    return new Promise(resolve => { setTimeout(resolve, ms); });
  }

  loading(hide) {
    document.querySelector('#loading')
    .classList[hide ? 'add' : 'remove']('hide');
    return this.wait(1000);
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
    return fetch('/auth/logout', {
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
