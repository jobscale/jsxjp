import webpush from 'web-push';

const logger = console;
const vapidKeys = webpush.generateVAPIDKeys();

logger.info(vapidKeys.publicKey);
logger.info(vapidKeys.privateKey);

// クライアント
// const applicationServerKey = 'server/publicKey.pem';
// const registration = await navigator.serviceWorker.ready;
// const subscription = await registration.pushManager.subscribe({
//   userVisibleOnly: true,
//   applicationServerKey,
// });
