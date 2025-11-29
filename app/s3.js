import zlib from 'zlib';
import {
  S3Client, GetObjectCommand, PutObjectCommand,
  ListObjectsV2Command, DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { service as configService } from './config/service.js';

const { ENV } = process.env;
const { Bucket } = {
  stg: { Bucket: 'stg-bucket-cold' },
  dev: { Bucket: 'dev-bucket-cold' },
  test: { Bucket: 'test-bucket-cold' },
}[ENV];
const config = {
  stg: { region: 'us-east-1' },
  dev: { region: 'us-east-1' },
  test: {
    region: 'ap-northeast-1',
    endpoint: 'https://lo-stack.jsx.jp',
    urlParser: url => {
      const op = new URL(url);
      return {
        protocol: op.protocol,
        hostname: op.hostname,
        port: op.port,
        path: op.pathname,
      };
    },
    endpointProvider: ep => ({ url: `${ep.Endpoint}${ep.Bucket}/` }),
  },
}[ENV];

const expandStream = async stream => {
  const chunks = [];
  for await (const chunk of stream) { chunks.push(chunk); }
  return Buffer.concat(chunks);
};

export class DB {
  async list(tableName, ContinuationToken, opt = { list: [] }) {
    const schema = `${ENV}/${tableName}`;
    const con = await this.connection(schema);
    const Prefix = `${schema}/`;
    const { Contents, NextContinuationToken } = await con.send(new ListObjectsV2Command({
      Bucket,
      Prefix,
      ContinuationToken,
    }));
    opt.list.push(...await Promise.all(
      (Contents ?? []).map(async obj => {
        const [, prefix, hash, key] = obj.Key.replace(/\.json\.gz$/, '').split('/');
        const item = await this.getValue(`${prefix}/${hash}`, key);
        item.key = key;
        return item;
      }),
    ));
    if (!NextContinuationToken) return opt.list;
    return this.list(tableName, NextContinuationToken, opt);
  }

  async getValue(tableName, key) {
    const schema = `${ENV}/${tableName}`;
    const con = await this.connection(schema);
    const { Body } = await con.send(new GetObjectCommand({
      Bucket,
      Key: `${schema}/${key}.json.gz`,
    }))
    .catch(() => ({}));
    if (!Body) return undefined;
    const encoded = await expandStream(Body);
    return JSON.parse(zlib.gunzipSync(encoded).toString('utf-8'));
  }

  async setValue(tableName, key, value) {
    const schema = `${ENV}/${tableName}`;
    const con = await this.connection(schema);
    const Key = `${schema}/${key}.json.gz`;
    await con.send(new PutObjectCommand({
      Bucket,
      Key,
      Body: zlib.gzipSync(JSON.stringify(value, null, 2)),
    }));
    return { key };
  }

  async deleteValue(tableName, key) {
    const schema = `${ENV}/${tableName}`;
    const con = await this.connection(schema);
    const Key = `${schema}/${key}.json.gz`;
    await con.send(new DeleteObjectCommand({
      Bucket, Key,
    }));
  }

  async connection(bucketName) {
    if (!this.cache) this.cache = {};
    if (this.cache[bucketName]) return this.cache[bucketName];
    this.cache[bucketName] = new S3Client({
      ...await this.credentials(),
      ...config,
    });
    return this.cache[bucketName];
  }

  async credentials() {
    const env = await configService.getEnv('storage');
    return {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      ...env,
    };
  }
}

export const db = new DB();
export const connection = bucketName => db.connection(bucketName);

export default { db, connection };
