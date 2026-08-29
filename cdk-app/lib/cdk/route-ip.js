import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { logger } from '@jobscale/create-logger';
import path from 'path';
import fs from 'fs';

export const route = (stack, { httpApi, integrationArn, sourceArn }) => {
  const command = fs.readFileSync(path.join(import.meta.dirname, 'bundling-before.sh'), 'utf-8')
  .split('\n').filter(Boolean).join(' && ');
  logger.info('Bundling', { command });
  const container = new lambda.Function(stack, 'IpFunction', {
    functionName: `${stack.stackName}-ip`,
    runtime: lambda.Runtime.NODEJS_LATEST,
    logGroup: new logs.LogGroup(stack, 'IpFunctionLogGroup', {
      logGroupName: `/aws/lambda/${stack.stackName}-ip`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.SIX_MONTHS,
    }),
    code: lambda.Code.fromAsset(path.join(process.cwd(), 'lib', 'functions', 'ip'), {
      bundling: {
        image: lambda.Runtime.NODEJS_LATEST.bundlingImage,
        command: ['bash', '-c', command],
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
