import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import path from 'path';

export const route = (stack, httpApi, envName, integrationArn, sourceArn) => {
  const ipFunction = new lambdaNodejs.NodejsFunction(stack, 'IpFunction', {
    runtime: lambda.Runtime.NODEJS_LATEST,
    entry: path.join(process.cwd(), 'lib', 'functions', 'ip', 'index.js'),
    handler: 'handler',
    environment: {
      ENV: envName,
    },
    bundling: {
      externalModules: ['@aws-sdk/*'],
    },
  });

  const ipIntegration = new apigwv2.CfnIntegration(stack, 'IpIntegration', {
    apiId: httpApi.ref,
    integrationType: 'AWS_PROXY',
    integrationUri: cdk.Fn.sub(integrationArn, {
      LambdaArn: ipFunction.functionArn,
    }),
    payloadFormatVersion: '2.0',
    integrationMethod: 'POST',
  });

  new apigwv2.CfnRoute(stack, 'IpRoute', {
    apiId: httpApi.ref,
    routeKey: 'GET /ip',
    target: cdk.Fn.join('', ['integrations/', ipIntegration.ref]),
  });

  ipFunction.addPermission('HttpApiInvokePermission', {
    principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    action: 'lambda:InvokeFunction',
    sourceArn,
  });
};
