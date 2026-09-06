import { logger } from '@jobscale/create-logger';

class Service {
  async ip(req) {
    const globalIp = req.headers.get('X-Forwarded-For')?.split(/[, ]/)[0] || req.socket.remoteAddress;
    if (!globalIp.startsWith('172.16.6.')) return globalIp;
    return this.wrapK8s(globalIp);
  }

  wrapK8s(globalIp) {
    // fetch the public IP and cache it for 5 minutes
    if (Date.now() > this.refreshIp) {
      // async background fetch to avoid blocking the response
      this.refreshIp = Date.now() + 1000 * 5;
      fetch('https://api.ipify.org')
      .then(res => res.text())
      .then(ip => {
        this.globalIp = ip;
        this.refreshIp = Date.now() + 1000 * 60 * 5;
      })
      .catch(e => {
        this.refreshIp = Date.now() + 1000 * 60;
        logger.error({ message: e.toString() });
      });
    }
    return this.globalIp ?? globalIp;
  }
}

export const service = new Service();
export default { Service, service };
