import net from 'net';
import { WebSocketServer } from 'ws';

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
  const dimension = BigInt(Number.parseInt(salt, 36));
  const num = BigInt(Number.parseInt(token, 36)) ^ dimension;
  if (BigInt(Date.now()) - num > 10_1000) {
    logger.warn(`Ignoring connection with invalid token: ${token}`);
    socket.destroy();
    return;
  }
  const target = `${host}:${port}`;
  if (!webSocketServer.has(target)) {
    webSocketServer.set(target, createWebSocketServer(target));
  }
  const wsServer = webSocketServer.get(target);
  wsServer.handleUpgrade(req, socket, head, ws => {
    wsServer.emit('connection', ws, req);
  });
};
