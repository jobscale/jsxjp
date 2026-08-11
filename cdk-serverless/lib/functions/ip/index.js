const { ENV } = process.env;

const logger = new Proxy(console, {
  get(target, prop) {
    return target[prop];
  },
});

export const handler = async event => {
  logger.info('EVENT:', JSON.stringify(event, null, 2));

  const { sourceIp } = event.requestContext.http;
  const ip = event.headers['x-forwarded-for']?.split(' ')[0] || sourceIp;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'x-env': ENV,
      server: 'jsx.jp',
    },
    body: `${ip}\n`,
  };
};
