const { ENV } = process.env;

const logger = new Proxy(console, {
  get(target, prop) {
    return target[prop];
  },
});

export const handler = async event => {
  logger.info('EVENT:', JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: `${JSON.stringify({
      message: 'Hello from Lambda!',
      env: ENV || 'undefined',
      input: event,
    }, null, 2)}\n`,
  };
};
