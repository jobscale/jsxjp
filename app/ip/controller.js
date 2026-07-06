export class Controller {
  ip(req, res) {
    const headers = new Headers(req.headers);
    const globalIp = headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? req.socket.remoteAddress;
    const remoteIp = globalIp ?? headers.get('X-Real-Ip');
    res.setHeader('Content-Type', 'text/plain');
    res.end(remoteIp);
  }
}

export const controller = new Controller();
export default { Controller, controller };
