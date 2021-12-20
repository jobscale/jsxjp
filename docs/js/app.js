/* eslint-env browser */
// eslint-disable-next-line no-unused-vars
class App {
  loading(hide) {
    document.querySelector('#loading')
    .classList[hide ? 'add' : 'remove']('hide');
  }
}
