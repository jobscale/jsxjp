/* global logger */

const wait = ms => new Promise(resolve => { setTimeout(resolve, ms); });
const loading = hide => {
  document.querySelector('#loading')
  .classList[hide ? 'add' : 'remove']('hide');
  return wait(1000);
}

class Menu {
  navigation(event) {
    event.preventDefault();
    document.body.classList.toggle('nav-open');
  }

  logout(event) {
    event.preventDefault();
    const see = loading();
    this.logoutInternal()
    .catch(e => logger.error(e.message))
    .then(() => see)
    .then(() => loading(true));
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
