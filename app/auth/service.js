const createHttpError = require('http-errors');
const speakeasy = require('speakeasy');
const { auth } = require('.');
const { createHash } = require('../user');
const { db } = require('../db');

const jwtSecret = 'node-express-ejs';
const getSecret = () => 'JSXJPX6EY4BMPXIRSSR74';

const { ENV } = process.env;
const tableName = {
  stg: 'stg-user',
  dev: 'user',
  test: 'dev-user',
}[ENV || 'dev'];

class Service {
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
    const hash = createHash(`${login}/${password}`);
    const item = await db.getValue(tableName, login);
    if (item.hash !== hash) throw createHttpError(401);
    if (code && !this.verifyCode(code)) throw createHttpError(401);
    const multiFactor = !code && this.generateCode();
    return db.setValue(tableName, login, { ...item, lastAccess: ts })
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

module.exports = {
  Service,
  service: new Service(),
};
