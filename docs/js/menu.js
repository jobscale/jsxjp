/* globals logger */

class Menu {
  initMenu() {
    return fetch('/menu')
    .then(res => res.text())
    .then(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      const top = document.createElement('div');
      top.append(div);
      document.body.append(...top.querySelectorAll('div > *'));
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
    .then(() => new Promise(resolve => { setTimeout(resolve, 2000); }))
    .then(() => {
      document.querySelector('.nav-container').style = 'visibility: inherit';
      const trigger = document.querySelector('.nav-trigger');
      trigger.addEventListener('click', event => {
        this.navigation(event);
      });
    });
  }
}

setTimeout(() => new Menu().trigger(), 1000);
