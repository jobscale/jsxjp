/* global logger */
/* global App */
class Register extends App {
  register(event) {
    event.preventDefault();
    const see = this.loading();
    this.registerInternal()
    .catch(e => logger.error(e.message))
    .then(() => see)
    .then(() => this.loading(true));
  }

  async registerInternal() {
    const login = document.querySelector('#login').value;
    const password = document.querySelector('#password').value;
    const confirm = document.querySelector('#confirm').value;
    const status = document.querySelector('#status');
    if (password !== confirm) {
      status.textContent = 'Mismatch Confirmation';
      return undefined;
    }
    status.textContent = '';
    const params = ['/user/register', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        credentials: 'omit',
      },
      body: JSON.stringify({ login, password }),
    }];
    return this.fetch(...params)
    .then(res => {
      status.textContent = `${res.status} ${res.statusText}`;
      if (res.status !== 200) {
        res.json()
        .then(json => {
          status.textContent += ` (${json.message})`;
        });
        return;
      }
      status.textContent += ' User Added';
      document.form.reset();
    });
  }

  trigger() {
    document.querySelector('form')
    .addEventListener('submit', event => this.register(event));
  }
}

window.addEventListener('DOMContentLoaded', () => new Register().trigger());
