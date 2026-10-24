import { createLogger } from 'https://esm.sh/@jobscale/create-logger';
// import { indexStore } from 'https://esm.sh/@jobscale/web-storage';

const VERSION = '0.1.6';
const CACHE_NAME = `jsxjp-pwa-${VERSION}`;
const logger = createLogger('info');

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
    event.waitUntil(caches.keys().then(async cacheNames => {
      await Promise.all(cacheNames
      .filter(name => name === 'pwa-builder-offline'
        || name.startsWith('jsxjp-pwa-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
      await self.clients.claim();
    }));
  }

  async push(event) {
    const notifyAction = async () => {
      const data = await Promise.resolve().then(() => event.data.json()).catch(async e => {
        logger.info(',,Ծ‸Ծ,,', e.cause?.message ?? e.message, VERSION);
        return { title: ',,Ծ‸Ծ,,', body: await event.data.text() };
      });
      const { title, body, icon, image, expired } = data;
      if (expired && new Date(expired) < new Date()) {
        logger.info('[PWA Builder] receive expired message', expired);
        return;
      }
      const controlled = await self.clients.matchAll({ type: 'window' });
      const [client] = controlled.length ? controlled
        : await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const [num] = crypto.getRandomValues(new Uint16Array(1));
      await new Promise(resolve => { setTimeout(resolve, Math.floor(num % 2000)); });
      client?.postMessage({ type: 'push-received', title, body, version: VERSION });
      await self.registration.showNotification(title, {
        body, icon, image: image ?? icon, data: { url: '/' }, tag: VERSION,
      });
    };
    event.waitUntil(notifyAction());
  }

  async notificationclick(event) {
    event.waitUntil(Promise.resolve().then(async () => {
      event.notification.close();
      const { notification: { title, body, data } } = event;
      if (!data || !data.url) return;
      const targetUrl = new URL(data.url, self.location.origin).href;
      const windowClients = await self.clients.matchAll({ type: 'window' });
      const exist = windowClients.find(client => client.url === targetUrl);
      const client = exist ?? await self.clients.openWindow(data.url);
      client?.postMessage({ type: 'push-clicked', title, body, version: VERSION });
    }));
  }

  async install(event) {
    event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(['/', '/favicon.ico']);
    }).then(() => self.skipWaiting()));
  }

  fetch(event) {
    const { request } = event;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin
      || url.pathname.startsWith('/api/')) return;

    event.respondWith(caches.open(CACHE_NAME).then(cache => self.fetch(request)
    .then(res => {
      if (!res.ok) return res;
      return cache.put(request, res.clone())
      .then(() => {
        logger.debug(`[PWA Builder] Network request cached. '${url.pathname}'`);
        return res;
      })
      .catch(e => {
        logger.error(`[PWA Builder] Cache '${url.pathname}'`, e.cause?.message ?? e.message, VERSION);
        return res;
      });
    })
    .catch(e => {
      logger.error(`[PWA Builder] Network request '${url.pathname}'`, e.cause?.message ?? e.message, VERSION);
      return cache.match(request)
      .then(res => res ?? cache.match('/'))
      .then(res => res ?? new Response('Offline', { status: 503, statusText: 'Service Unavailable' }));
    })));
  }

  addEventListener(type, listener) {
    logger.debug('[PWA Builder] Add EventListener', type);
    self.addEventListener(type, (...argv) => {
      logger.debug('[PWA Builder] Triggered EventListener', type);
      return listener(...argv);
    });
  }
}

const entry = async () => {
  logger.info('[PWA Builder] backend service worker', new ServiceWorker().version);
};

entry();
