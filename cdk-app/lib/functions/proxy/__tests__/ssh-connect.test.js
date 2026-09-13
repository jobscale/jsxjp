import { createServer as createHttpServer } from 'http';
import { createServer as createNetServer } from 'net';
import { describe, expect, jest, it } from '@jest/globals';
import { WebSocket } from 'ws';

const mockService = {
  webPush: jest.fn().mockResolvedValue(undefined),
  slack: jest.fn().mockResolvedValue(undefined),
};

jest.unstable_mockModule('../app/api/service.js', () => ({ service: mockService }));

const { upgradeHandler } = await import('../app/ssh-connect.js');

const listen = server => new Promise(resolve => {
  server.listen(0, '127.0.0.1', () => {
    resolve(server.address().port);
  });
});

const close = server => new Promise(resolve => {
  server.close(resolve);
});

describe('ssh-connect', () => {
  it('upgrades a WebSocket and proxies data to SSH', async () => {
    const sshServer = createNetServer(socket => {
      socket.on('data', data => socket.write(data));
    });
    const sshPort = await listen(sshServer);
    const httpServer = createHttpServer();
    httpServer.on('upgrade', upgradeHandler);
    const httpPort = await listen(httpServer);
    const token = Date.now().toString(36);
    const ws = new WebSocket(`ws://127.0.0.1:${httpPort}/ssh/${token}/0/127.0.0.1/${sshPort}`);

    try {
      await new Promise((resolve, reject) => {
        ws.once('open', () => ws.send('ping'));
        ws.once('message', data => {
          expect(data.toString()).toBe('ping');
          resolve();
        });
        ws.once('error', reject);
      });
    } finally {
      ws.close();
      await close(httpServer);
      await close(sshServer);
    }
  });
});
