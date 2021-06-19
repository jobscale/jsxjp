const logger = console;
class Burdening {
  action() {
    logger.info('OK');
  }
  trigger() {
    fetch('https://jsx.jp')
    .then(() => this.action())
    .catch(e => e);
  }
}
document.addEventListener('DOMContentLoaded', () => new Burdening().trigger());
