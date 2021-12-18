/* eslint-env browser */
/* global Common */
class App extends Common {
  constructor(name) {
    super();
    this.name = name;
  }

  trigger(event) {
    logger.info(this.name, event);
  }
}

window.addEventListener('DOMContentLoaded', event => new App('window').trigger(event));
