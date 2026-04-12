import net from 'net';
import { WebSocketServer } from 'ws';
import { service } from './api/service.js';

const logger = new Proxy(console, {
  get(target, prop) {
    if (prop in target) {
      return (...args) => {
        const timestamp = new Date().toISOString();
        target[prop](`[${timestamp}] [WS SERVER]`, ...args);
      };
    }
    return target[prop];
  },
});

const createWebSocketServer = target => {
  const wsServer = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
  });

  wsServer.on('connection', ws => {
    const [host, port] = target.split(':');
    const ssh = net.connect(Number.parseInt(port, 10), host);

    ssh.on('connect', () => {
      logger.info(`SSH connection established to ${target}`);
    });

    ws.on('message', data => {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      ssh.write(buffer);
    });

    ssh.on('data', chunk => {
      if (ws.readyState === ws.OPEN) {
        ws.send(chunk, { binary: true });
      }
    });

    ws.on('close', () => {
      ssh.end();
    });

    ssh.on('close', () => {
      if (ws.readyState === ws.OPEN) {
        ws.close();
      }
    });

    ws.on('error', e => {
      logger.error('WebSocket error:', e);
      ssh.destroy();
    });

    ssh.on('error', e => {
      logger.error('SSH error:', e);
      if (ws.readyState === ws.OPEN) {
        ws.close();
      }
    });
  });

  return wsServer;
};

const webSocketServer = new Map();

export const sshConnection = (req, socket, head) => {
  const [, , token, salt, host, port] = req.url.split('/');
  const target = `${host}:${port}`;
  const dimension = BigInt(Number.parseInt(salt, 36));
  const num = Date.now() - Number.parseFloat(BigInt(Number.parseInt(token, 36)) ^ dimension);
  if (num < 0 || num > 10_000) {
    const alert = `Ignoring connection with invalid token: ${token} for target ${target}`;
    service.webPush({ title: 'WSS Connection', body: alert });
    service.slack({ icon_emoji: ':octopus:', username: 'WSS Connection', text: alert });
    logger.warn(alert);
    socket.destroy();
    return;
  }
  service.webPush({ title: 'WSS Connection', body: `Connecting to ${target}` });
  service.slack({ icon_emoji: ':seal:', username: 'WSS Connection', text: `Connecting to ${target}` });
  if (!webSocketServer.has(target)) {
    webSocketServer.set(target, createWebSocketServer(target));
  }
  const wsServer = webSocketServer.get(target);
  wsServer.handleUpgrade(req, socket, head, ws => {
    wsServer.emit('connection', ws, req);
  });
};
