#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib/core';
import { AppStack } from '../lib/app-stack.js';

const logger = new Proxy(console, {
  get(target, prop) {
    return target[prop];
  },
});

const cdkApp = new cdk.App();
const envName = cdkApp.node.tryGetContext('env');

const envConfigs = {
  dev: {
    account: '393035998684',
    region: 'us-east-1',
    gateway: {
      certificateId: '9d6f7e65-704e-4395-a3d5-641276b383d0',
      domainName: `${envName}-serverless.jsx.jp`,
    },
    front: {
      certificateId: '9d6f7e65-704e-4395-a3d5-641276b383d0',
      domainName: `${envName}-front.jsx.jp`,
      bucketName: `${envName}-front-static`,
    },
  },
  stg: {
    account: '123035998684',
    region: 'ap-northeast-1',
    gateway: {
      certificateId: '123f7e65-704e-4395-a3d5-641276b383d0',
      domainName: `${envName}-serverless.jsx.jp`,
    },
    front: {
      certificateId: '123f7e65-704e-4395-a3d5-641276b383d0',
      domainName: `${envName}-front.jsx.jp`,
      bucketName: `${envName}-front-static`,
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
  stackName: `${envName}-app`,
  envName,
});
new AppStack(cdkApp, `${envName}-app`, {
  ...config,
  envName,
  env: {
    account: config.account,
    region: config.region,
  },
});
