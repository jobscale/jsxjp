/* globals logger */
class Menu {
  navigation(event) {
    logger.info('menu navigation');
    event.preventDefault();
    document.body.classList.toggle('nav-open');
  }

  trigger() {
    logger.info('menu trigger');
    document.querySelector('.nav-trigger')
    .addEventListener('click', event => this.navigation(event));
  }
}

setTimeout(() => new Menu().trigger(), 1000);
