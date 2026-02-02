import crypto, { webcrypto } from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';

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
      name: 'PBKDF2', salt, iterations: 10_000, hash: 'SHA-256',
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async encrypt(value, password) {
    let pw;
    if (password) pw = new TextEncoder().encode(password);
    value = new Uint8Array(gzipSync(JSON.stringify(value)));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(pw ?? this.PASSWORD, salt);
    const encrypted = await webcrypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, value,
    );
    // 暗号化の最後を JSON ではなくバイナリ連結にする例
    const result = Buffer.concat([
      Buffer.from(salt.map((v, i) => v ^ (i + 0xb) % 0xdb)),
      Buffer.from(iv),
      Buffer.from(encrypted),
    ]);
    return result.toString('base64');
  }

  async decrypt(coded, password) {
    let pw;
    if (password) pw = new TextEncoder().encode(password);
    const combined = Buffer.from(coded, 'base64');
    const obfuscatedSalt = combined.subarray(0, 16);
    const iv = combined.subarray(16, 16 + 12);
    const data = combined.subarray(16 + 12);
    const salt = new Uint8Array(obfuscatedSalt.map((v, i) => v ^ (i + 0xb) % 0xdb));
    const key = await this.deriveKey(pw ?? this.PASSWORD, salt);
    const decrypted = await webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, data,
    );
    const buf = gunzipSync(Buffer.from(decrypted));
    return JSON.parse(buf.toString());
  }
}

export const cipher = new Cipher();
export default { Cipher, cipher };
