import { validation } from '../../../../../app/auth/validation.js';
// import { service as auth } from '../../../../../app/auth/service.js';

const { ENV } = process.env;

const logger = new Proxy(console, {
  get(target, prop) {
    return target[prop];
  },
});

export const handler = async event => {
  logger.info('EVENT:', JSON.stringify(event, null, 2));

  await validation.login({ body: JSON.parse(event.body) });
  // await auth.login(event);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: `${JSON.stringify({
      message: 'Welcome',
      env: ENV || 'undefined',
      'input event': event,
    }, null, 2)}\n`,
  };
};

// example
// curl -i -X POST https://dev-serverless.jsx.jp/user/welcome --data '{"login":"guest","password":"secret"}' -H 'Content-Type: application/json'
