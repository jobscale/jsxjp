/* eslint-env browser */
class Update extends Common {
  constructor() {
    super();
    this.interval();
  }

  date() {
    const params = {
      req: [
        `/robots.txt?v=${Date.now()}`,
        { method: 'head' },
      ],
      begin: performance.now(),
    };
    fetch(...params.req)
    .then(res => res.headers.get('date'))
    .then(gmt => {
      this.self.stack.push(Math.floor((performance.now() - params.begin) * 10));
      if (this.self.stack.length > 20) this.self.stack.shift();
      this.self.span.textContent = Math.floor(this.self.stack.reduce((...s) => s[0] + s[1], 0) / this.self.stack.length);
      this.self.date.textContent = new Date(gmt).toLocaleString();
    })
    .catch(e => this.self.span.textContent = e.message);
  }

  interval() {
    this.self = {
      stack: [],
      span: document.querySelector('#span'),
      date: document.querySelector('#date'),
    };
    setTimeout(() => this.setInterval(), 998);
  }

  setInterval() {
    setInterval(() => this.date(), 998);
  }
}

window.addEventListener('DOMContentLoaded', () => new Update());
