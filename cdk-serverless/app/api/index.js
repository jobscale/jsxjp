import crypto from 'crypto';
import { createCanvas, registerFont } from 'canvas';
import { cipher } from '../cipher.js';

export const genDigit = async () => {
  const num = Number.parseInt(crypto.randomBytes(2).toString('hex'), 16);
  const digit = `${Math.floor(num % 10000)}`.padStart(4, '0');

  const width = 100;
  const height = 42;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ccc';

  const random = () => Number.parseInt(crypto.randomBytes(2).toString('hex'), 16);
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(random() % width);
    const y = Math.floor(random() % height);
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  registerFont('docs/fonts/Tangerine.ttf', { family: 'Tangerine' });

  ctx.beginPath();
  ctx.font = '54px Tangerine';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#111';
  const [x, y] = [width / 2, height / 2 - 4];
  ctx.fillText(digit, x - 2, y - 2);
  ctx.fillText(digit, x + 2, y + 2);
  ctx.shadowColor = '#111';
  ctx.fillStyle = '#ccc';
  ctx.fillText(digit, x, y);

  const buffer = canvas.toBuffer('image/png');
  const base64 = buffer.toString('base64');
  const image = `data:image/png;base64,${base64}`;
  const ts = new Date().toISOString();
  const secret = await cipher.encrypt(JSON.stringify({ ts, digit }), digit);
  return { image, secret };
};

export const verifyDigit = async (secret, digit) => {
  const result = await cipher.decrypt(secret, digit).then(JSON.parse).catch(() => ({}));
  if (result.digit !== digit) return false;
  const ts = new Date(result.ts).getTime();
  const diffMinutes = (Date.now() - ts) / (1000 * 60);
  return diffMinutes <= 30;
};
