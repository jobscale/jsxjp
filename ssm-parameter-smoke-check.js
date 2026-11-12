import { SSMClient, PutParameterCommand, GetParameterCommand, DeleteParameterCommand } from '@aws-sdk/client-ssm';
import { configure } from './.env.js';

configure('ssm');
// 書き込みと読み取りで即時整合性を確認
const logger = console;
const client = new SSMClient({ region: 'us-east-1' });
const Name = '/dev/a-test/latency';
const Value = JSON.stringify({ test: new Date().toISOString() });
await client.send(new PutParameterCommand({
  Name,
  Value,
  Type: 'String',
  Overwrite: true,
}));
const start = Date.now();
const res = await client.send(new GetParameterCommand({ Name }));
if (res.Parameter?.Value === Value) {
  logger.info({ benchmark: `${(Date.now() - start) / 1000}s` });
  await client.send(new DeleteParameterCommand({ Name }));
} else {
  logger.warn({ 'no value update': `${(Date.now() - start) / 1000}s` });
}
