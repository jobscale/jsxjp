const { App } = require('./app');

const main = () => {
  const prom = {};
  prom.pending = new Promise(resolve => { prom.resolve = resolve; });
  const app = new App().start();
  const options = {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
  };
  app.listen(options, () => {
    logger.info(JSON.stringify({
      Server: 'Started',
      'Listen on': `http://127.0.0.1:${options.port}`,
    }, null, 2));
    prom.resolve(app);
  });
  return prom.pending;
};

module.exports = {
  server: main(),
};
