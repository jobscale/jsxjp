import http from 'http';
import './app/config/index.js';
import { logger } from '@jobscale/logger';
import { app, upgradeHandler, errorHandler } from './app/index.js';

const PORT = Number.parseInt(process.env.PORT || 3000, 10);

const httpServer = (port, bind = '127.0.0.1') => {
  const server = http.createServer();
  server.on('connection', socket => socket.on('error', logger.error));
  server.on('request', app);
  server.on('upgrade', upgradeHandler);
  server.on('error', errorHandler);
  server.listen(port, bind, () => {
    logger.info(JSON.stringify({
      Server: 'Started',
      'Listen on': `http://127.0.0.1:${port}`,
    }, null, 2));
  });
  return app;
};

export default httpServer(PORT, '0.0.0.0');
