import http from 'http';
import { createLogger } from '@jobscale/create-logger';
import { app, errorHandler } from './cdk-app/lib/functions/proxy/app/index.js';
import { upgradeHandler } from './cdk-app/lib/functions/proxy/app/ssh-connect.js';

const { LOG_LEVEL, PORT = '3000' } = process.env;
const logger = createLogger({ level: LOG_LEVEL });

const usePort = Number.parseInt(PORT, 10);

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

export default httpServer(usePort, '0.0.0.0');
