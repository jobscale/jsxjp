/* globals logger */

class Menu {
  initMenu() {
    return fetch('/menu')
    .then(res => res.text())
    .then(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.head.append(...div.querySelectorAll('link'));
      document.body.append(...div.querySelectorAll('.nav-trigger, .nav-container, .nav-overlay'));
    });
  }

  navigation(event) {
    logger.info('menu navigation');
    event.preventDefault();
    document.body.classList.toggle('nav-open');
  }

  trigger() {
    logger.info('menu trigger');
    this.initMenu()
    .then(() => {
      document.querySelector('.nav-trigger')
      .addEventListener('click', event => this.navigation(event));
      return new Promise(resolve => { setTimeout(resolve, 200); });
    })
    .then(() => document.body.classList.remove('hide'));
  }
}

setTimeout(() => new Menu().trigger(), 1000);
