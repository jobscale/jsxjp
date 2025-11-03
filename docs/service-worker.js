/* eslint-env worker */
const logger = console;

const version = '0.1.0';

const formatTimestamp = ts => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(ts || new Date());

const parseData = async data => {
  try { return data.json(); } catch (e) { return { title: ',,Ծ‸Ծ,,', body: await data.text() }; }
};

class ServiceWorker {
  constructor() {
    this.initEvent();
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
    const data = await parseData(event.data);
    const { title, body, icon, expired } = data;
    if (expired && new Date(expired) < new Date()) return;

    event.waitUntil(
      Promise.resolve().then(async () => {
        const [client] = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        client?.postMessage({ type: 'push-received', title, body, version });
        await self.registration.showNotification(title, { body, icon });
      }),
    );
  }

  async notificationclick(event) {
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
  }

  async install(event) {
    event.waitUntil(
      self.skipWaiting().then(async () => {
        const cache = await caches.open('pwabuilder-offline');
        await Promise.all(
          ['GET /', 'GET /favicon.ico'].map(async path => {
            await fetch(path)
            .then(async res => {
              logger.debug(`[PWA Builder] Cached offline page during Install ${res.url}`);
              await cache.put(path, res);
            })
            .catch(e => {
              logger.error(`[PWA Builder] Failed to cache '${path}': ${e}`);
            });
          }),
        );
      }),
    );
  }

  fetch(event) {
    if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
      return;
    }
    event.respondWith(caches.open('pwabuilder-offline').then(cache => {
      const url = new URL(event.request.url);
      const path = `${event.request.method} ${url.pathname}`;
      return self.fetch(event.request)
      .then(res => {
        // if (event.request.method !== 'GET') return res;
        cache.put(path, res.clone());
        logger.debug(`[PWA Builder] Network request cached. '${path}'`);
        return res.clone();
      })
      .catch(e => {
        logger.error(`[PWA Builder] Network request Failed. '${path}': ${e}`);
      })
      .then(res => res || cache.match(path).then(r => r && r.clone()))
      .then(res => res || cache.match('GET /').then(r => r && r.clone()));
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
const pwa = {
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
    await new Promise(resolve => { setTimeout(resolve, 5000); });
    const notification = new Notification(info.title, {
      body: info.message,
      icon: '/favicon.ico',
    });
    notification.onclick = () => logger.info('onclick');
  },

  async preloadContext() {
    const arrayBuffer = await fetch('/assets/mp3/notify.mp3')
    .then(res => res.arrayBuffer())
    .catch(() => new ArrayBuffer());
    this.audioContext = new AudioContext();
    this.audioContext.addEventListener('statechange', event => {
      logger.info('statechange', event);
    });
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  },

  async playSound() {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    const audioSource = this.audioContext.createBufferSource();
    audioSource.buffer = this.audioBuffer;
    audioSource.connect(this.audioContext.destination);
    audioSource.addEventListener('ended', () => {
      audioSource.disconnect();
      logger.info('disconnect audioSource');
    });
    audioSource.start();
  },

  async trigger() {
    await this.preloadContext();
    navigator.serviceWorker.addEventListener('message', async event => {
      const { type, title, body } = event.data;
      if (type === 'push-received') {
        logger.info('Push received:', JSON.stringify({ title, body, version }));
        await this.playSound();
      }
    });
  },

  async register() {
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

    await this.trigger();
  },
};

const entry = async () => {
  // background
  if (typeof window === 'undefined') {
    const sw = new ServiceWorker();
    logger.info('backend service worker', JSON.stringify(sw));
    return;
  }

  // browser
  window.pwa = { ...(window.pwa ?? {}), ...pwa };
  window.pwa.register();
};

// enter browser or background
entry();
