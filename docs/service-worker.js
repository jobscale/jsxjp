/* eslint-env browser */
class ServiceWorker {
  constructor() {
    this.logger = console;
    this.url = 'https://jsx.jp';
    this.offlinePage = new Request('/');
    this.initEvent();
  }

  initEvent() {
    this.addEventListener('activate', event => {
      this.logger.info('activate', event);
      event.waitUntil(window.self.clients.claim());
    });
    this.addEventListener('push', event => {
      this.logger.info('push', event);
      const getData = data => {
        try { return data.json().notification; } catch (e) { return { title: 'Push Notification Title', body: data.text() }; }
      };
      const message = event.data ? getData(event.data) : ',,Ծ‸Ծ,,';
      if (message.click_action) this.url = message.click_action;
      event.waitUntil(
        window.self.registration.showNotification(message.title, message),
      );
    });
    this.addEventListener('notificationclick', event => {
      if (!this.url) return;
      event.notification.close();
      event.waitUntil(
        window.self.clients.matchAll({ type: 'window' }).then(windowClients => {
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url === this.url && 'focus' in client) {
              return client.focus();
            }
          }
          return window.self.clients.openWindow && window.self.clients.openWindow(this.url);
        }),
      );
    });
    this.addEventListener('install', event => {
      this.logger.info('install', event);
      event.waitUntil(window.self.skipWaiting());
      event.waitUntil(
        fetch(this.offlinePage)
        .then(response => caches.open('pwabuilder-offline')
        .then(cache => {
          this.logger.log(`[PWA Builder] Cached offline page during Install${response.url}`);
          return cache.put(this.offlinePage, response);
        })),
      );
    });
    this.addEventListener('fetch', event => {
      if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
        return;
      }
      event.respondWith(
        window.self.fetch(event.request)
        .catch(error => {
          this.logger.error(`[PWA Builder] Network request Failed. Serving offline page ${error}`);
          return caches.open('pwabuilder-offline')
          .then(cache => cache.match('/'));
        }),
      );
    });
    this.addEventListener('refreshOffline', event => caches.open('pwabuilder-offline')
    .then(cache => {
      this.logger.log(`[PWA Builder] Offline page updated from refreshOffline event: ${event.url}`);
      return cache.put(this.offlinePage, event);
    }));
  }

  addEventListener(type, listener) {
    window.self.addEventListener(type, listener);
  }
}

window.pwa = {
  ...window.pwa,
  sw: new ServiceWorker(),
};
