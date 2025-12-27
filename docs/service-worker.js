const logger = console;
logger.debug = () => undefined;

const VERSION = '0.1.1';

const parseData = async data => {
  try {
    return data.json();
  } catch (e) {
    logger.debug(e.message);
    return { title: ',,Ծ‸Ծ,,', body: await data.text() };
  }
};

class ServiceWorker {
  constructor() {
    this.initEvent();
  }

  get version() {
    return VERSION;
  }

  initEvent() {
    this.addEventListener('activate', this.activate);
    this.addEventListener('push', this.push);
    this.addEventListener('notificationclick', this.notificationclick);
    this.addEventListener('install', this.install);
    this.addEventListener('fetch', this.fetch);
  }

  activate(event) {
    event.waitUntil(self.clients.claim());
  }

  async push(event) {
    const notifyAction = async () => {
      const data = await parseData(event.data);
      const { title, body, icon, image, expired } = data;
      if (expired && new Date(expired) < new Date()) return;
      const controlled = await self.clients.matchAll({ type: 'window' });
      const [client] = controlled.length ? controlled
        : await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const [num] = crypto.getRandomValues(new Uint16Array(1));
      await new Promise(resolve => { setTimeout(resolve, Math.floor(num % 2000)); });
      client?.postMessage({ type: 'push-received', title, body, version: VERSION });
      await self.registration.showNotification(title, { body, icon, image: image ?? icon, data: { url: '/' } });
    };
    event.waitUntil(notifyAction());
  }

  async notificationclick(event) {
    const clickAction = async () => {
      event.notification.close();
      const { notification: { title, body, data } } = event;
      if (!data || !data.url) return;
      const targetUrl = new URL(data.url, self.location.origin).href;
      const windowClients = await self.clients.matchAll({ type: 'window' });
      const exist = windowClients.find(client => client.url === targetUrl);
      const client = exist ?? await self.clients.openWindow(data.url);
      client?.postMessage({ type: 'push-clicked', title, body, version: VERSION });
    };
    event.waitUntil(clickAction());
  }

  async install(event) {
    const installAction = async () => {
      const cache = await caches.open('pwa-builder-offline');
      await Promise.all(
        ['GET /', 'GET /favicon.ico'].map(async path => {
          const [method, pathname] = path.split(' ');
          await self.fetch(pathname, { method })
          .then(async res => {
            logger.debug(`[PWA Builder] Cached offline page during Install ${res.url}`);
            await cache.put(path, res);
          })
          .catch(e => {
            logger.error(`[PWA Builder] Failed to cache '${path}': ${e}`);
          });
        }),
      );
    };
    event.waitUntil(self.skipWaiting().then(installAction));
  }

  fetch(event) {
    const { request } = event;
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
      const busyAction = async () => {
        const walkerBody = 'walker busy';
        logger.info({ walkerBody });
        return new Response(walkerBody, { status: 503 });
      };
      event.respondWith(busyAction());
      return;
    }
    const cacheAction = cache => {
      const url = new URL(request.url);
      const path = `${request.method} ${url.pathname}`;
      return self.fetch(request)
      .then(res => {
        const allowCache = url.pathname.startsWith('/s/');
        const allowMethod = ['GET', 'HEAD', 'OPTIONS'];
        if (!allowMethod.includes(request.method) && !allowCache) return res;
        if (!res.ok) return res;
        cache.put(path, res.clone());
        logger.debug(`[PWA Builder] Network request cached. '${path}'`);
        return res.clone();
      })
      .catch(e => {
        logger.error(`[PWA Builder] Network request Failed. '${path}'`, e.message);
      })
      .then(res => res ?? cache.match(path).then(r => r && r.clone()))
      .then(res => res ?? cache.match('GET /').then(r => r && r.clone()));
    };
    event.respondWith(caches.open('pwa-builder-offline').then(cacheAction));
  }

  addEventListener(type, listener) {
    logger.debug('Add EventListener', type);
    self.addEventListener(type, (...argv) => {
      logger.debug('Triggered EventListener', type);
      return listener(...argv);
    });
  }
}

const entry = async () => {
  logger.info('backend service worker', new ServiceWorker().version);
};

entry();
