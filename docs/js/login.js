/* global logger */

const wait = ms => new Promise(resolve => { setTimeout(resolve, ms); });
const loading = hide => {
  document.querySelector('#loading')
  .classList[hide ? 'add' : 'remove']('hide');
  return wait(1000);
}

class Login {
  login(event) {
    event.preventDefault();
    const see = loading();
    this.loginInternal()
    .catch(e => logger.error(e.message))
    .then(() => see)
    .then(() => loading(true));
  }

  async loginInternal() {
    const login = document.querySelector('#login').value;
    const password = document.querySelector('#password').value;
    const status = document.querySelector('#status');
    status.textContent = '';
    const params = ['/auth/login', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        credentials: 'omit',
      },
      body: JSON.stringify({ login, password }),
    }];
    return fetch(...params)
    .then(res => {
      status.textContent = `${res.status} ${res.statusText}`;
      if (res.status !== 200) {
        res.json()
        .then(json => {
          status.textContent += ` (${json.message})`;
        });
        return;
      }
      res.json()
      .then(json => {
        document.location.href = json.href;
      });
    });
  }

  trigger() {
    document.querySelector('form')
    .addEventListener('submit', event => this.login(event));
  }
}

window.addEventListener('DOMContentLoaded', () => new Login().trigger());
