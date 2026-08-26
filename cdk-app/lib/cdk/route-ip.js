import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import path from 'path';

export const route = (stack, { httpApi, integrationArn, sourceArn }) => {
  const container = new lambda.Function(stack, 'IpFunction', {
    functionName: `${stack.stackName}-ip`,
    runtime: lambda.Runtime.NODEJS_LATEST,
    code: lambda.Code.fromAsset(path.join(process.cwd(), 'lib', 'functions', 'ip'), {
      bundling: {
        image: lambda.Runtime.NODEJS_LATEST.bundlingImage,
        command: [
          'bash', '-c',
          'export HOME=/tmp && cp -r . /asset-output && (cd /asset-output && rm -fr node_modules package-lock.json && npm i --omit=dev)',
        ],
      },
    }),
    handler: 'index.handler',
    timeout: cdk.Duration.seconds(3),
    memorySize: 128,
    environment: {
      ENV: stack.context.envName,
    },
  });

  const integration = new apigwv2.CfnIntegration(stack, 'IpIntegration', {
    apiId: httpApi.ref,
    integrationType: 'AWS_PROXY',
    integrationUri: cdk.Fn.sub(integrationArn, {
      LambdaArn: container.functionArn,
    }),
    payloadFormatVersion: '2.0',
    integrationMethod: 'POST',
  });

  new apigwv2.CfnRoute(stack, 'IpRoute', {
    apiId: httpApi.ref,
    routeKey: 'GET /ip',
    target: cdk.Fn.join('', ['integrations/', integration.ref]),
  });

  container.addPermission('HttpApiInvokePermission', {
    principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    action: 'lambda:InvokeFunction',
    sourceArn,
  });
};
