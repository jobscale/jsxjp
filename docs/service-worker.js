/* eslint-env worker */
const logger = console;

const formatTimestamp = ts => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(ts || new Date());

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
    const parseData = async data => {
      try { return data.json(); } catch (e) { return { title: ',,Ծ‸Ծ,,', body: await data.text() }; }
    };
    this.addEventListener('push', async event => {
      logger.info('push', event);
      const data = await parseData(event.data);
      event.waitUntil(
        self.registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon,
        }),
      );
    });
    this.addEventListener('notificationclick', async event => {
      const data = await parseData(event.data);
      if (!data.clickAction) return;
      event.notification.close();
      event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(windowClients => {
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url === data.clickAction) {
              client.focus();
              return;
            }
          }
          self.clients.openWindow(data.clickAction);
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
        .catch(e => {
          logger.error(`[PWA Builder] Network request Failed. Serving offline page ${e}`);
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

  window.pwa = {
    ...(window.pwa || {}),

    sendToServer(subscription) {
      subscription = {
        ...JSON.parse(JSON.stringify(subscription)),
        ua: navigator.userAgent,
        ts: `${formatTimestamp()} GMT+9`,
      };
      logger.info('subscription', subscription);
      return fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(res => logger.info(res))
      .catch(e => logger.error(e));
    },

    toUint8Array(base64String) {
      base64String = base64String.trim();
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = `${base64String}${padding}`
      .replace(/-/g, '+')
      .replace(/_/g, '/');
      const rawData = atob(base64);
      const output = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        output[i] = rawData.charCodeAt(i);
      }
      return output;
    },

    async generateSubscription() {
      const { pushManager } = await navigator.serviceWorker.ready;
      const exist = await pushManager.getSubscription();
      if (exist) return exist;
      const publicPem = await fetch('/api/public').then(res => res.text());
      const applicationServerKey = this.toUint8Array(publicPem);
      const subscription = await pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      return subscription;
    },

    async notification(info = {}) {
      if (Notification.permission === 'denied') return;
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        logger.info('通知が有効になりました！');
        info.trigger = 'init';
      }
      await this.generateSubscription()
      .then(subscription => this.sendToServer(subscription))
      .catch(e => logger.warn(e));
      if (info.condition && info.condition !== info.trigger) return;
      const notification = new Notification(info.title, {
        body: info.message,
        icon: '/favicon.ico',
      });
      notification.onclick = () => logger.info('onclick');
    },
  };
};

registerSW();
