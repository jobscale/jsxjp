import { logger } from 'https://esm.sh/@jobscale/logger';

class Menu {
  initMenu() {
    return fetch('/menu')
    .then(res => res.text())
    .then(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.append(...div.children);
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
    })
    .then(() => new Promise(resolve => { setTimeout(resolve, 100); }))
    .then(() => {
      const trigger = document.querySelector('.nav-trigger');
      trigger.addEventListener('click', event => this.navigation(event));
      trigger.style = 'visibility: inherit';
    });
  }
}

window.addEventListener('DOMContentLoaded', () => setTimeout(() => new Menu().trigger(), 200));
