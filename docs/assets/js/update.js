/* eslint-env browser */
class Update extends Common {
  constructor() {
    super();
    setTimeout(() => this.interval(), 200);
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
      document.querySelector('#span')
      .textContent = Math.floor(this.self.stack.reduce((...s) => s[0] + s[1], 0) / this.self.stack.length);
      document.querySelector('#date')
      .textContent = new Date(gmt).toLocaleString();
    })
    .catch(e => document.querySelector('#span').textContent = e.message);
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
    setTimeout(() => this.setInterval(), 998);
  }

  setInterval() {
    setInterval(() => this.date(), 998);
  }

  play() {
    if (this.latest && (this.latest + 60000) > Date.now()) return;
    this.self.sound.play();
    this.latest = Date.now();
  }
}

window.addEventListener('DOMContentLoaded', () => new Update());
