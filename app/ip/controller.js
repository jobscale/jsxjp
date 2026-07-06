export class Controller {
  ip(req, res) {
    const headers = new Headers(req.headers);
    const globalIp = headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? req.socket.remoteAddress;
    res.setHeader('Content-Type', 'text/plain');
    res.end(globalIp);
  }
}

export const controller = new Controller();
export default { Controller, controller };
