import { logger } from '@jobscale/logger';

class Service {
  ip(req, wrap = false) {
    const headers = new Headers(req.headers);
    const globalIp = headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? req.socket.remoteAddress;
    return wrap ? this.wrapK8s(globalIp) : globalIp;
  }

  wrapK8s(globalIp) {
    // If the IP is not in the 172.16.6.x range, return it directly
    if (!globalIp.startsWith('172.16.6.')) return globalIp;
    // fetch the public IP and cache it for 5 minutes
    if (!this.globalIp || Date.now() > this.refreshIp) {
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
