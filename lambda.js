const fs = require('fs');
const awsServerlessExpress = require('aws-serverless-express');
const logger = require('@jobscale/logger');
const { server: application } = require('.');

const distribution = () => {
  const env = Buffer.from(fs.readFileSync('/etc/os-release')).toString();
  logger.info({ env });
  return env;
};

exports.handler = async event => {
  logger.info('EVENT', JSON.stringify(event, null, 2));

  distribution();

  return application
  .then(app => awsServerlessExpress.createServer(app))
  .then(server => new Promise((succeed, error) => {
    awsServerlessExpress.proxy(server, event, { succeed, error });
  }))
  .catch(e => logger.error(e) || {
    statusCode: 503,
    headers: { 'Content-Length': 'application/json' },
    body: JSON.stringify({ message: e.name }),
  })
  .then(response => {
    logger.info('RESPONSE', JSON.stringify(response, null, 2));
    return response;
  });
};
