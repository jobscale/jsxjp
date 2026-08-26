import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { AppStack } from '../lib/app-stack.js';

const defaultGatewayContext = {
  gateway: {
    certificateId: 'test-certificate-id',
    domainName: 'test-serverless.jsx.jp',
  },
  front: {
    certificateId: 'test-front-certificate-id',
    domainName: 'test-front.jsx.jp',
    bucketName: 'test-front-static',
  },
};

describe('AppStack', () => {
  it('creates a NodejsFunction for the proxy handler', () => {
    const app = new cdk.App();
    const stack = new AppStack(app, 'AppStack', { envName: 'test', ...defaultGatewayContext });

    const proxyFunction = stack.node.tryFindChild('ProxyFunction');

    expect(proxyFunction).toBeInstanceOf(lambda.Function);
  });
});
