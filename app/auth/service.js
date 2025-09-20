import { createHash } from 'crypto';
import createHttpError from 'http-errors';
import speakeasy from 'speakeasy';
import { auth } from './index.js';
import { db } from '../db.js';

const jwtSecret = 'node-express-ejs';
const getSecret = () => 'JSXJPX6EY4BMPXIRSSR74';

export class Service {
  async now() {
    return new Date().toISOString();
  }

  generateSecret() {
    return speakeasy.generateSecret({
      name: 'jsx.jp',
    }).base32;
  }

  generateCode() {
    const time = Math.floor(Date.now() / 1000) + 30;
    return speakeasy.totp({
      secret: getSecret(),
      encoding: 'base32',
      time,
    });
  }

  verifyCode(token) {
    return speakeasy.totp.verify({
      secret: getSecret(),
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  async login(rest) {
    const { login, password, code } = rest;
    if (!login || !password) throw createHttpError(400);
    const ts = new Date().toISOString();
    const hash = createHash('sha3-256').update(`${login}/${password}`).digest('base64');
    const item = await db.getValue('user', login);
    if (!item || item.hash !== hash) throw createHttpError(401);
    if (code && !this.verifyCode(code)) throw createHttpError(401);
    const multiFactor = !code && this.generateCode();
    return db.setValue('user', login, { ...item, lastAccess: ts })
    .then(() => ({
      token: auth.sign({ login, ts }, jwtSecret),
      multiFactor,
    }));
  }

  async verify(token) {
    if (!token) throw createHttpError(400);
    if (!auth.verify(token, jwtSecret)) throw createHttpError(403);
  }

  async decode(token) {
    if (!token) throw createHttpError(400);
    const payload = auth.decode(token);
    if (!payload) throw createHttpError(403);
    return payload;
  }

  async totp({ secret }) {
    const time = Math.floor(Date.now() / 1000) + 30;
    const code = speakeasy.totp({
      secret,
      encoding: 'base32',
    });
    const list = [code];
    list.push(speakeasy.totp({
      secret,
      encoding: 'base32',
      time,
    }));
    return { code, list };
  }
}

export const service = new Service();

export default {
  Service,
  service,
};
