export class Controller {
  ip(req, res) {
    const headers = new Headers(req.headers);
    const ip = req.socket.remoteAddress || req.ip;
    const remoteIp = headers.get('X-Real-Ip') || headers.get('X-Forwarded-For') || ip;
    res.setHeader('Content-Type', 'text/plain');
    res.end(remoteIp);
  }
}

export const controller = new Controller();

export default { Controller, controller };
