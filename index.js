const { Server } = require('_http_server');
const { App } = require('./app');

class HttpServer extends Server {
  listen(port) {
    super.listen(port);
    this.on('error', e => this.onError(e));
    this.on('listening', () => this.onListening());
  }

  onError(e) {
    if (e.syscall !== 'listen') {
      throw e;
    }
    switch (e.code) {
    case 'EACCES':
      logger.error('pipe requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error('port already in use');
      process.exit(1);
      break;
    default:
      throw e;
    }
  }

  onListening() {
    const bind = this.address();
    bind.ts = new Date().toLocaleString();
    logger.info(bind);
  }
}

const main = () => {
  const app = new App();
  const handle = app.start();
  const options = {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
  };
  new HttpServer(handle).listen(options);
};

module.exports = {
  main: main(),
};
