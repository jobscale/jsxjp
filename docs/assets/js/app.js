class App {
  constructor() {
    setTimeout(() => this.trigger(), 1000);
  }

  trigger() {
    document.querySelector('#change-scheme')
    .addEventListener('click', event => this.action(event));
  }

  action() {
    const html = document.querySelector('html');
    html.classList.toggle('dark-scheme');
    html.classList.toggle('light-scheme');
  }
}

window.addEventListener('DOMContentLoaded', event => new App(event));
