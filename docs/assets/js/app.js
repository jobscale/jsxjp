/* eslint-env browser */
class App extends Common {
  constructor(name) {
    super();
    this.name = name;
  }
  trigger(event) {
    logger.info(this.name, event);
  }
}

document.addEventListener('DOMContentLoaded', event => new App('document').trigger(event));
window.addEventListener('DOMContentLoaded', event => new App('window').trigger(event));
