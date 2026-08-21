import * as cdk from 'aws-cdk-lib/core';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { AppStack } from '../lib/app-stack.js';

test('creates a NodejsFunction for the proxy handler', () => {
  const app = new cdk.App();
  const stack = new AppStack(app, 'AppStack', { envName: 'test' });

  const proxyFunction = stack.node.tryFindChild('ProxyFunction');

  expect(proxyFunction).toBeInstanceOf(lambdaNodejs.NodejsFunction);
});
