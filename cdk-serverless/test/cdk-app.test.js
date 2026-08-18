import * as cdk from 'aws-cdk-lib/core';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { CdkServerlessStack } from '../lib/cdk-serverless-stack';

test('creates a NodejsFunction for the proxy handler', () => {
  const app = new cdk.App();
  const stack = new CdkServerlessStack(app, 'TestServerlessStack', { envName: 'test' });

  const proxyFunction = stack.node.tryFindChild('ProxyFunction');

  expect(proxyFunction).toBeInstanceOf(lambdaNodejs.NodejsFunction);
});
