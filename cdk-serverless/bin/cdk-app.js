#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib/core';
import { CdkServerlessStack } from '../lib/cdk-serverless-stack.js';

const logger = new Proxy(console, {
  get(target, prop) {
    return target[prop];
  },
});

const app = new cdk.App();
const envName = app.node.tryGetContext('env');

const envConfigs = {
  dev: {
    account: '393035998684',
    certificateId: '9d6f7e65-704e-4395-a3d5-641276b383d0',
    domainName: `${envName}-serverless.jsx.jp`,
    front: {
      certificateId: '9d6f7e65-704e-4395-a3d5-641276b383d0',
      domainName: `${envName}-front.jsx.jp`,
      bucketName: `${envName}-static-content-393035998684`,
    },
  },
  stg: {
    account: '123035998684',
    certificateId: '123f7e65-704e-4395-a3d5-641276b383d0',
    domainName: `${envName}-serverless.jsx.jp`,
    front: {
      certificateId: '123f7e65-704e-4395-a3d5-641276b383d0',
      domainName: `${envName}-front.jsx.jp`,
      bucketName: `${envName}-static-content-123035998684`,
    },
  },
};

const config = envConfigs[envName];
if (!config) {
  const envList = Object.keys(envConfigs).join(', ');
  const e = new Error(
    `Unknown env '${envName}'. Valid env are: ${envList}`,
  );
  logger.error(e.message);
  throw e;
}

logger.info({
  stackName: `${envName}-cdk-serverless`,
  envName,
});
new CdkServerlessStack(app, `${envName}-cdk-serverless`, {
  ...config,
  envName,
  env: {
    account: config.account,
  },
});
