const { gzipSync, gunzipSync } = require('zlib');

const logger = console;
const gst = 'H4sIAAAAAAAAA';
const gpr = new RegExp(`^${gst}`);

const encode = value => Buffer.from(gzipSync(Buffer.from(value))).toString('base64').replace(gpr, '');

const decode = value => Buffer.from(gunzipSync(Buffer.from(`${gst}${value}`, 'base64'))).toString();

const sample = () => {
  const obj = {};

  const user = new Proxy(obj, {
    set: (target, key, value) => {
      target[key] = encode(value);
      return target[key];
    },
    get: (target, key) => decode(target[key]),
  });

  user.name = 'かいじゃりすいぎょのすいぎょうまつうんらいまつふうらいまつ';

  logger.info('obj', obj);
  logger.info(obj.name);
  logger.info('---');
  logger.info('user', user);
  logger.info(user.name);
};
[sample.planNine, sample.planEight] = [
  '6tWcnENcYwPCPL3cnUOifd2jVSyUko2sPQLKwjxTQwzMY4PLXbKTi/IczPx8LaMSjTyzQ9xDHQxC3X3CvSLSo+ICFCqBQB6LOW4RAAAAA==',
  'xWMy2rDMBBF/0XrGI88nhlNd3EWaaAEnCd0J0syhdQP4iwCof9eZXkP95yX8SGkZTEf5lRfzrg+6L5sCGUr2xZKnIfvafD7230e2sux3bXaHK+nxqzMY7qlMWvP6TkXlkmJkAkrlwcLWRBLTgsrBJUyqoLaQtQl7cCK1NK9/64W9LEX9jZC5NwNP34c0+8u5vZGvz6p5sM18yWFe3pkKNyx73oMqqTWVT5q5B6AIEUKgObvH8Pe5wjVAAAA',
];

const plan = pen => () => decode(pen);

module.exports = {
  planNine: plan(sample.planNine),
  planEight: plan(sample.planEight),
  encode,
  decode,
};
