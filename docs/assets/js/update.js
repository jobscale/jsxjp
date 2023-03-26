/* global Howl */
/* eslint-disable no-return-assign */

class Update {
  constructor() {
    this.self = { stack: [] };
    setTimeout(() => this.interval(), 0);
    setTimeout(() => this.trigger(), 1000);
  }

  trigger() {
    const access = document.querySelector('#access');
    access.textContent = '[⛄ click 🍻]';
    access.addEventListener('click', event => this.action(event), {
      once: true,
    });
  }

  action(event) {
    event.preventDefault();
    const { currentTarget: target } = event;
    target.textContent = 'loading...';
    this.self.sound = new Howl({ src: ['/assets/mp3/warning1.mp3'] });
    this.self.sound.once('load', () => {
      target.textContent = '☃';
    });
    fetch('/favicon.ico', {
      method: 'post',
    })
    .then(res => {
      const { headers } = res;
      const key = ['x-backend-host', 'x-host', 'x-server', 'x-served-by', 'server'].find(name => headers.get(name));
      return headers.get(key);
    })
    .catch(e => (o => o)(console).warn(e.message))
    .then(host => {
      document.querySelector('#welcome').textContent = `${host}`;
    });
  }

  updateSpan() {
    const { stack } = this.self;
    if (!stack.length) return;
    if (stack.length > 60) stack.length = 60;
    const span = Math.floor(stack.reduce((a, b) => a + b, 0.0)) / stack.length;
    document.querySelector('#time-span')
    .textContent = span.toFixed(1);
  }

  updateDate() {
    const { stack } = this.self;
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
      document.querySelector('#date')
      .textContent = new Date(gmt).toLocaleString();
      stack.unshift(Math.floor((performance.now() - params.begin) * 10) / 10);
      this.updateSpan();
    })
    .catch(e => document.querySelector('#time-span').textContent = e.message);
  }

  checkDate() {
    const busy = document.querySelector('#busy > span');
    if (this.self.busy) {
      busy.textContent = `${this.self.busy} 🍺`;
      this.self.busy++;
      const { stack } = this.self;
      if (stack.length > 10) stack.length = 10;
      if (!stack.length) stack.push(1000.0);
      else stack[0] += 1000;
      this.updateSpan();
      return;
    }
    this.self.busy = 1;
    this.updateDate()
    .then(() => {
      busy.textContent = '';
      if (this.self.busy > 1) {
        const dead = document.querySelector('#dead');
        dead.innerHTML = `<span>${this.self.busy}</span>${dead.innerHTML}`;
      }
      delete this.self.busy;
    });
  }

  interval() {
    setTimeout(() => {
      setInterval(() => this.checkDate(), 1000);
    }, 1000 - (Date.now() % 1000));
  }

  play() {
    if (this.latest && (this.latest + 60000) > Date.now()) return;
    this.latest = Date.now();
    const play = () => this.self.sound && this.self.sound.play();
    const actions = ['alert play sound.', this.latest, play()];
    (o => o)(console).info(...actions);
    const busyTs = document.querySelector('#busy-ts > span');
    busyTs.textContent = new Date(this.latest).toLocaleTimeString();
  }
}

window.addEventListener('DOMContentLoaded', () => new Update());
