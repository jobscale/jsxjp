/* eslint-env browser */
class Reset {
  reset(event) {
    event.preventDefault();
    const login = document.querySelector('#login').value;
    const password = document.querySelector('#password').value;
    const confirm = document.querySelector('#confirm').value;
    const status = document.querySelector('#status');
    if (password !== confirm) {
      status.textContent = 'Mismatch Confirmation';
      return;
    }
    status.textContent = '';
    const params = ['/user/reset', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        credentials: 'omit',
      },
      body: JSON.stringify({ login, password }),
    }];
    fetch(...params)
    .then(res => {
      status.textContent = `${res.status} ${res.statusText}`;
      if (res.status !== 200) {
        res.json()
        .then(json => {
          status.textContent += ` (${json.message})`;
        });
        return;
      }
      status.textContent += ' User Reset';
      document.form.reset();
    });
  }

  trigger() {
    document.querySelector('form')
    .addEventListener('submit', event => this.reset(event));
  }
}

window.addEventListener('DOMContentLoaded', () => new Reset().trigger());
