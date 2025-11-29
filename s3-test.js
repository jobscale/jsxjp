import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { configure } from './.env.js';

configure('s3');
// 書き込みと読み取りで即時整合性を確認
const logger = console;
const client = new S3Client({ region: 'us-east-1' });
const Bucket = 'dev-bucket-cold';
const Key = 'dev/a-test-latency';
const Body = JSON.stringify({ test: new Date().toISOString() });
await client.send(new PutObjectCommand({ Bucket, Key, Body }));
const start = Date.now();
const res = await client.send(new GetObjectCommand({ Bucket, Key }));
const data = [];
for await (const chunk of res.Body) {
  data.push(chunk.toString());
}
if (data.join('') === Body) {
  logger.info({ benchmark: `${(Date.now() - start) / 1000}s` });
  await client.send(new DeleteObjectCommand({ Bucket, Key }));
} else {
  logger.warn({ 'no value update': `${(Date.now() - start) / 1000}s` });
}
