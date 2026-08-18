const { ENV } = process.env;

const logger = new Proxy(console, {
  get(target, prop) {
    return target[prop];
  },
});

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Env': ENV,
  server: 'jsx.jp',
};

export const handler = async event => {
  logger.info('EVENT:', JSON.stringify(event, null, 2));

  const { sourceIp } = event.requestContext.http;
  const ip = event.headers['x-forwarded-for']?.split(' ')[0] || sourceIp;

  return {
    statusCode: 200,
    headers: {
      ...headers,
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: ip,
  };
};
