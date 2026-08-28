#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib/core';
import { AppStack } from '../lib/app-stack.js';

const logger = new Proxy(console, {
  get(target, prop) {
    return target[prop];
  },
});

const cdkApp = new cdk.App();
const envName = cdkApp.node.tryGetContext('env') ?? '';

const envConfigs = {
  dev: {
    env: {
      account: '916921211348',
      region: 'us-east-1',
    },
    context: {
      gateway: {
        certificateId: 'f55e911f-453e-4e27-8569-276156c987fd',
        domainName: `${envName}-serverless.jsx.jp`,
      },
      front: {
        certificateId: 'f55e911f-453e-4e27-8569-276156c987fd',
        domainName: `${envName}-front.jsx.jp`,
        bucketName: `${envName}-front-static`,
      },
    },
  },
  stg: {
    env: {
      account: '916921211348',
      region: 'ap-northeast-1',
    },
    context: {
      gateway: {
        certificateId: '1c06e554-19c4-4cc8-abf0-4dc84803e2f5',
        domainName: `${envName}-serverless.jsx.jp`,
      },
      front: {
        certificateId: 'f55e911f-453e-4e27-8569-276156c987fd',
        domainName: `${envName}-front.jsx.jp`,
        bucketName: `${envName}-front-static`,
      },
    },
  },
};

const config = envConfigs[envName];
if (!config) {
  const envList = Object.keys(envConfigs).join(', ');
  const message = `Unknown env '${envName}'. Valid env are: ${envList}`;
  logger.error({ message, envName, envList });
  throw new Error(message);
}

new AppStack(cdkApp, `${envName}-app`, {
  ...config.context,
  envName,
  env: config.env,
});
