const logger = console;

const formatTimestamp = (ts = Date.now(), withoutTimezone = false) => {
  const timestamp = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));
  if (withoutTimezone) return timestamp;
  return `${timestamp}+09:00`;
};

class PWAClient {
  sendToServer(subscription) {
    subscription = {
      ...JSON.parse(JSON.stringify(subscription)),
      ua: navigator.userAgent,
      ts: formatTimestamp(),
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
  }

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
  }

  async generateSubscription() {
    if (window.Capacitor && window.Capacitor.Plugins.PushNotifications) {
      // Capacitor natively handles subscription
      const { PushNotifications } = window.Capacitor.Plugins;
      await PushNotifications.register();
      PushNotifications.addListener('registration', token => {
        this.sendToServer({ token: token.value });
      });
      return;
    }
    const { pushManager } = await navigator.serviceWorker.ready;
    const exist = await pushManager.getSubscription();
    const subscription = async () => {
      const publicPem = await fetch('/api/public').then(res => res.text());
      const applicationServerKey = this.toUint8Array(publicPem);
      return pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    };
    this.sendToServer(exist || await subscription())
    .catch(e => logger.warn({ ...e }));
  }

  async notification(info = {}) {
    if (window.Capacitor) {
      // Capacitor handles permissions automatically via device settings
      await this.generateSubscription();
      return;
    }
    if (Notification.permission === 'denied') return;
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      logger.info('通知が有効になりました！');
      info.trigger = 'init';
    }
    await this.generateSubscription();
    if (info.condition && info.condition !== info.trigger) return;
    await new Promise(resolve => { setTimeout(resolve, 5000); });
    const notification = new Notification(info.title, {
      body: info.message,
      icon: '/favicon.ico',
    });
    notification.onclick = () => logger.info('onclick');
  }

  async preloadContext() {
    const arrayBuffer = await fetch('/assets/mp3/notify.mp3')
    .then(res => res.arrayBuffer())
    .catch(() => new ArrayBuffer());
    this.audioContext = new AudioContext();
    this.audioContext.addEventListener('statechange', event => {
      logger.info('statechange', event);
    });
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  async playSound() {
    const audioSource = this.audioContext.createBufferSource();
    audioSource.buffer = this.audioBuffer;
    audioSource.connect(this.audioContext.destination);
    audioSource.addEventListener('ended', () => {
      audioSource.disconnect();
      logger.info('disconnect audioSource');
    });
    audioSource.start();
  }

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
  }

  async register() {
    await navigator.serviceWorker.register('/service-worker.js')
    .then(reg => {
      logger.info('Service Worker registered:', reg);
    });

    setTimeout(() => {
      this.notification({
        title: 'JSXJP',
        message: '通知が有効になりました',
        condition: 'init',
      });
    }, 5000);

    await this.trigger();
  }
}

const entry = async () => {
  if (window.pwa) {
    logger.warn(new Error('PWA window.pwa exists'));
    return;
  }
  window.pwa = new PWAClient();
  window.pwa.register();
};

entry();
