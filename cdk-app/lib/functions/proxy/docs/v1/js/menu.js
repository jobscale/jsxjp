import { logger } from 'https://esm.sh/@jobscale/create-logger';

class Menu {
  initMenu() {
    return fetch('/v1/menu/')
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
    document.querySelector('.nav-container').scrollTop = 0;
  }

  trigger() {
    logger.info('menu trigger');
    this.initMenu()
    .then(() => new Promise(resolve => { setTimeout(resolve, 2000); }))
    .then(() => {
      document.querySelector('.nav-container').style.visibility = 'inherit';
    })
    .then(() => new Promise(resolve => { setTimeout(resolve, 100); }))
    .then(() => {
      const trigger = document.querySelector('.nav-trigger');
      trigger.addEventListener('click', event => this.navigation(event));
      trigger.style.visibility = 'inherit';
      const overlay = document.querySelector('.nav-overlay');
      overlay.addEventListener('click', event => this.navigation(event));
    });
  }
}

window.addEventListener('DOMContentLoaded', () => setTimeout(() => new Menu().trigger(), 200));
