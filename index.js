import http from 'http';
import './app/config/index.js';
import { logger } from '@jobscale/logger';
import { app, errorHandler } from './app/index.js';

const PORT = Number.parseInt(process.env.PORT || 3000, 10);

const main = async () => {
  const server = http.createServer(app);
  server.on('error', errorHandler);
  const options = {
    host: '0.0.0.0',
    port: PORT,
  };
  server.listen(options, () => {
    logger.info(JSON.stringify({
      Server: 'Started',
      'Listen on': `http://127.0.0.1:${options.port}`,
    }, null, 2));
  });
  return app;
};

export default await main();
