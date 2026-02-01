import crypto, { webcrypto } from 'crypto';
import { gzip, gunzip } from 'zlib/promises';

const serviceName = 'jsx.jp';
const hash = crypto.createHash('sha3-256').update(serviceName).digest('base64');

export class Cipher {
  constructor(password = `2026:${hash}`) {
    const encoder = new TextEncoder();
    this.PASSWORD = encoder.encode(`${password}:${serviceName.split('.').reverse().join('.')}`);
  }

  async deriveKey(password, salt) {
    const keyMaterial = await webcrypto.subtle.importKey(
      'raw', password, 'PBKDF2', false, ['deriveKey'],
    );

    return webcrypto.subtle.deriveKey({
      name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256',
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async encrypt(text) {
    text = new Uint8Array(await gzip(text));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(this.PASSWORD, salt);
    const encrypted = await webcrypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, text,
    );
    const json = {
      salt: Array.from(salt),
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    };
    return Buffer.from(JSON.stringify(json)).toString('base64');
  }

  async decrypt(coded) {
    const obj = JSON.parse(Buffer.from(coded, 'base64').toString());
    const salt = new Uint8Array(obj.salt);
    const iv = new Uint8Array(obj.iv);
    const data = new Uint8Array(obj.data);
    const key = await this.deriveKey(this.PASSWORD, salt);
    const decrypted = await webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, data,
    );
    const buf = await gunzip(Buffer.from(decrypted));
    return buf.toString();
  }
}

export const cipher = new Cipher();
export default { Cipher, cipher };
