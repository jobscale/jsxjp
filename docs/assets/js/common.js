/* global window */
/* eslint-disable no-unused-expressions */
window.Common || (() => {
  class Common {
    constructor() {
      this.saver = { ok: 'ok', ng: 'ng' };
      this.logger = window.console;
    }
    get self() {
      return this.saver;
    }
  }
  window.Common = Common;
})();
