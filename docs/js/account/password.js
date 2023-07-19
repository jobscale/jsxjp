/* global logger */

const wait = ms => new Promise(resolve => { setTimeout(resolve, ms); });
const loading = hide => {
  document.querySelector('#loading')
  .classList[hide ? 'add' : 'remove']('hide');
  return wait(1000);
}

class Password {
  password(event) {
    event.preventDefault();
    const see = loading();
    this.passwordInternal()
    .catch(e => logger.error(e.message))
    .then(() => see)
    .then(() => loading(true));
  }

  async passwordInternal() {
    const password = document.querySelector('#password').value;
    const confirm = document.querySelector('#confirm').value;
    const status = document.querySelector('#status');
    if (password !== confirm) {
      status.textContent = 'Mismatch Confirmation';
      return undefined;
    }
    status.textContent = '';
    const params = ['/account/password', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        credentials: 'omit',
      },
      body: JSON.stringify({ password }),
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
      setTimeout(() => document.logout(), 2000);
    });
  }

  trigger() {
    document.querySelector('form')
    .addEventListener('submit', event => this.password(event));
  }
}

window.addEventListener('DOMContentLoaded', () => new Password().trigger());
