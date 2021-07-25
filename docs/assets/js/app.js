/* eslint-env browser */
class App extends Common {
  constructor(parent) {
    super();
    this.parent = parent;
  }
  trigger(event) {
    logger.info(this.parent, event);
  }
}

window.addEventListener('DOMContentLoaded', new App('window').trigger);
document.addEventListener('DOMContentLoaded', new App('document').trigger);
