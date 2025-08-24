export class Controller {
  ip(req, res) {
    const headers = new Headers(req.headers);
    const ip = req.socket.remoteAddress || req.ip;
    const remoteIp = headers.get('X-Real-Ip') || headers.get('X-Forwarded-For') || ip;
    res.send(remoteIp);
  }
}

export const controller = new Controller();

export default {
  Controller,
  controller,
};
