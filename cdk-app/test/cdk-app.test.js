import * as cdk from 'aws-cdk-lib/core';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
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

test('creates a NodejsFunction for the proxy handler', () => {
  const app = new cdk.App();
  const stack = new AppStack(app, 'AppStack', { envName: 'test', ...defaultGatewayContext });

  const proxyFunction = stack.node.tryFindChild('ProxyFunction');

  expect(proxyFunction).toBeInstanceOf(lambdaNodejs.NodejsFunction);
});

test('proxy lambda is configured for outbound internet access', () => {
  const app = new cdk.App();
  const stack = new AppStack(app, 'AppStack', { envName: 'test', ...defaultGatewayContext });

  const proxyVpc = stack.node.tryFindChild('AppVpc');
  const proxyFunction = stack.node.tryFindChild('ProxyFunction');
  const cfnFunction = proxyFunction.node.defaultChild;

  expect(proxyVpc).toBeTruthy();
  expect(cfnFunction.vpcConfig).toMatchObject({
    subnetIds: expect.any(Array),
    securityGroupIds: expect.any(Array),
  });
  expect(cfnFunction.vpcConfig.subnetIds.length).toBeGreaterThan(0);
  expect(cfnFunction.vpcConfig.securityGroupIds.length).toBeGreaterThan(0);
});
