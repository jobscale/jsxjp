/* eslint-env browser */
// eslint-disable-next-line no-unused-vars
class App {
  constructor() {
    if (!window.logger) {
      window.logger = console;
    }
  }

  loading(hide) {
    document.querySelector('#loading')
    .classList[hide ? 'add' : 'remove']('hide');
    return this.wait(1000);
  }

  fetch(url, options) {
    const customOptions = {
      ...options,
      redirect: 'error',
    };
    return fetch(url, customOptions);
  }

  wait(milliseconds) {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }
}
