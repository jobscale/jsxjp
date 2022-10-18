class Service {
  async now() {
    return new Date().toISOString();
  }
}

module.exports = {
  Service,
  service: new Service(),
};
