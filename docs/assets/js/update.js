/* eslint-env browser */
class Update extends Common {
  constructor() {
    super();
    setTimeout(() => this.trigger(), 200);
    setTimeout(() => this.interval(), 200);
  }

  trigger() {
    const access = document.querySelector('#access');
    access.textContent = '[click]';
    access.addEventListener('click', event => this.action(event), { once: true });
  }

  action(event) {
    event.target.textContent = 'hello';
  }

  updateDate() {
    const params = {
      req: [
        `/robots.txt?v=${Date.now()}`,
        { method: 'head' },
      ],
      begin: performance.now(),
      warn: setTimeout(() => this.play(), 2000),
    };
    return fetch(...params.req)
    .then(res => res.headers.get('date'))
    .then(gmt => {
      clearTimeout(params.warn);
      this.self.stack.push(Math.floor((performance.now() - params.begin) * 10));
      if (this.self.stack.length > 20) this.self.stack.shift();
      document.querySelector('#time-span')
      .textContent = Math.floor(this.self.stack.reduce((...s) => s[0] + s[1], 0) / this.self.stack.length);
      document.querySelector('#date')
      .textContent = new Date(gmt).toLocaleString();
    })
    .catch(e => document.querySelector('#time-span').textContent = e.message);
  }

  date() {
    if (this.busy) return;
    this.busy = true;
    this.updateDate()
    .then(() => {
      delete this.busy;
    });
  }

  interval() {
    this.self = {
      stack: [],
      sound: new Howl({ src: ['/assets/mp3/warning1.mp3'] }),
    };
    this.self.sound.once('load', () => {
      const delay = 1000 - Date.now() % 1000;
      setTimeout(() => {
        setInterval(() => this.date(), 1000);
      }, delay);
    });
  }

  play() {
    if (this.latest && (this.latest + 60000) > Date.now()) return;
    const actions = ['alert play sound.', this.self.sound.play()];
    logger.info(...actions)
    this.latest = Date.now();
  }
}

window.addEventListener('DOMContentLoaded', () => new Update());
