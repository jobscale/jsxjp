import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import path from 'path';

export const route = (stack, { httpApi, integrationArn, sourceArn }) => {
  const container = new lambda.Function(stack, 'ProxyFunction', {
    functionName: `${stack.stackName}-proxy`,
    runtime: lambda.Runtime.NODEJS_LATEST,
    code: lambda.Code.fromAsset(path.join(process.cwd(), 'lib', 'functions', 'proxy'), {
      bundling: {
        image: lambda.Runtime.NODEJS_LATEST.bundlingImage,
        command: [
          'bash', '-c',
          'export HOME=/tmp && export npm_config_cache=/tmp/.npm && cp -r . /asset-output && (cd /asset-output && rm -fr node_modules package-lock.json && npm i --omit=dev)',
        ],
      },
    }),
    handler: 'index.handler',
    timeout: cdk.Duration.seconds(28),
    memorySize: 256,
    environment: {
      ENV: stack.context.envName,
      NODE_OPTIONS: '--enable-source-maps',
    },
  });

  const integration = new apigwv2.CfnIntegration(stack, 'ProxyIntegration', {
    apiId: httpApi.ref,
    integrationType: 'AWS_PROXY',
    integrationUri: cdk.Fn.sub(integrationArn, {
      LambdaArn: container.functionArn,
    }),
    payloadFormatVersion: '2.0',
    integrationMethod: 'POST',
  });

  new apigwv2.CfnRoute(stack, 'ProxyRoute', {
    apiId: httpApi.ref,
    routeKey: 'ANY /{proxy+}',
    target: cdk.Fn.join('', ['integrations/', integration.ref]),
  });

  container.addPermission('HttpApiInvokePermission', {
    principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    action: 'lambda:InvokeFunction',
    sourceArn,
  });
};
