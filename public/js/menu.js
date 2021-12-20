/* eslint-env browser */
class Menu {
  navigation(event) {
    event.preventDefault();
    document.body.classList.toggle('nav-open');
  }

  logout(event) {
    if (event) event.preventDefault();
    fetch('/auth/logout', {
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
    document.logout = this.logout;
    document.querySelector('#logout')
    .addEventListener('click', event => this.logout(event));
    document.querySelector('.nav-trigger')
    .addEventListener('click', event => this.navigation(event));
  }
}

setTimeout(() => {
  new Menu().trigger();
}, 1000);
