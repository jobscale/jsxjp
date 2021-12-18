const { Service } = require('../service');

class TopService extends Service {
}

module.exports = {
  TopService,
  topService: new TopService(),
};
