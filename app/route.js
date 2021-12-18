const { Router } = require('express');

class Route {
  constructor() {
    this.router = Router();
    this.handle = (...args) => this.router(...args);
    this.use = (...args) => this.router.use(...args);
    this.get = (...args) => this.router.get(...args);
    this.post = (...args) => this.router.post(...args);
    this.put = (...args) => this.router.put(...args);
    this.delete = (...args) => this.router.delete(...args);
    this.patch = (...args) => this.router.patch(...args);
  }
}

module.exports = {
  Route,
};
