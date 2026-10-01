import { createLogger } from '@jobscale/create-logger';

const { ENV, LOG_LEVEL } = process.env;
const logger = createLogger({ level: LOG_LEVEL });

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Env': ENV,
  Server: 'jsx.jp',
};

export const handler = async event => {
  logger.info('EVENT:', JSON.stringify(event, null, 2));

  const { sourceIp } = event.requestContext.http;
  const ip = event.headers['x-forwarded-for']?.split(/[, ]/)[0] || sourceIp;

  return {
    statusCode: 200,
    headers: {
      ...headers,
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: ip,
  };
};
