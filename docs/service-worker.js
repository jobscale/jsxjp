/* eslint-env worker */
const logger = console;

class ServiceWorker {
  constructor() {
    this.url = 'https://jsx.jp';
    this.offlinePage = new Request('/');
    this.initEvent();
  }

  initEvent() {
    this.addEventListener('activate', event => {
      logger.info('activate', event);
      event.waitUntil(self.clients.claim());
    });
    this.addEventListener('push', event => {
      logger.info('push', event);
      const getData = data => {
        try { return data.json().notification; } catch (e) { return { title: 'Push Notification Title', body: data.text() }; }
      };
      const message = event.data ? getData(event.data) : ',,Ծ‸Ծ,,';
      if (message.click_action) this.url = message.click_action;
      event.waitUntil(
        self.registration.showNotification(message.title, message),
      );
    });
    this.addEventListener('notificationclick', event => {
      if (!this.url) return;
      event.notification.close();
      event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(windowClients => {
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url === this.url && 'focus' in client) {
              return client.focus();
            }
          }
          return self.clients.openWindow && self.clients.openWindow(this.url);
        }),
      );
    });
    this.addEventListener('install', event => {
      logger.info('install', event);
      event.waitUntil(self.skipWaiting());
      event.waitUntil(
        fetch(this.offlinePage)
        .then(response => caches.open('pwabuilder-offline')
        .then(cache => {
          logger.debug(`[PWA Builder] Cached offline page during Install ${response.url}`);
          return cache.put(this.offlinePage, response);
        })),
      );
    });
    this.addEventListener('fetch', event => {
      if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
        return;
      }
      event.respondWith(
        self.fetch(event.request)
        .catch(error => {
          logger.error(`[PWA Builder] Network request Failed. Serving offline page ${error}`);
          return caches.open('pwabuilder-offline')
          .then(cache => cache.match('/'));
        }),
      );
    });
    this.addEventListener('refreshOffline', event => caches.open('pwabuilder-offline')
    .then(cache => {
      logger.debug(`[PWA Builder] Offline page updated from refreshOffline event: ${event.url}`);
      return cache.put(this.offlinePage, event);
    }));
  }

  addEventListener(type, listener) {
    logger.debug('Add EventListener', type);
    self.addEventListener(type, (...argv) => {
      logger.debug('Triggered EventListener', type);
      return listener(...argv);
    });
  }
}

/* eslint-env browser */
const registerSW = async () => {
  // バックグラウンド
  if (typeof window === 'undefined') {
    const sw = new ServiceWorker();
    logger.info('backend service worker', JSON.stringify(sw));
    return;
  }

  // メインスレッド
  await navigator.serviceWorker.register('/service-worker.js')
  .then(reg => {
    logger.info('Service Worker registered:', reg);
  });

  setTimeout(() => {
    window.pwa.notification({
      title: 'JSXJP',
      message: '通知が有効になりました',
      condition: 'init',
    });
  }, 5000);

  // アプリケーションの状態管理用
  window.pwa = {
    ...(window.pwa || {}),
    notification: async (info = {}) => {
      if (Notification.permission === 'denied') return;
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        logger.info('通知が有効になりました！');
        info.trigger = 'init';
      }
      if (
        info.condition && info.condition !== info.trigger
      ) return;
      const notification = new Notification(info.title || '更新があります！', {
        body: info.message || '新しいコンテンツが利用可能です。',
        icon: '/favicon.ico',
      });
      notification.onclick = () => logger.info('onclick');
    },
  };
};

registerSW();
