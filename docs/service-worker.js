/* eslint-env worker */
const logger = console;
logger.debug = () => undefined;

const VERSION = '0.1.1';

const formatTimestamp = (ts = Date.now()) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(new Date(ts));

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
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
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
      const { type, title, body, version } = event.data;
      if (type === 'push-received') {
        logger.info('Push received', JSON.stringify({ title, body, version }));
        await this.playSound();
      }
      if (type === 'push-clicked') {
        logger.info('Push clicked', JSON.stringify({ title, body, version }));
        await this.playSound();
        window.focus();
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
    logger.info('backend service worker', new ServiceWorker().version);
    return;
  }

  // browser
  window.pwa = { ...window.pwa ?? {}, ...pwa };
  window.pwa.register();
};

// enter browser or background
entry();
