class Service {
  now() {
    return Promise.resolve(new Date());
  }
}

module.exports = {
  Service,
};
