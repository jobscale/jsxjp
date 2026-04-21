import http from 'http';
import './app/config/index.js';
import { logger } from '@jobscale/logger';
import { app, upgradeHandler, errorHandler } from './app/index.js';
import { proxyConnect } from './app/proxy-connect.js';

const PORT = Number.parseInt(process.env.PORT || 3000, 10);

const httpServer = (port, bind = '127.0.0.1') => {
  const server = http.createServer(app);
  server.on('connection', socket => socket.on('error', logger.error));
  server.on('upgrade', upgradeHandler);
  server.on('connect', proxyConnect);
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
