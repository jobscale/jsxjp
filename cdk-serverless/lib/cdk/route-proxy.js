import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import path from 'path';

export const route = (stack, httpApi, integrationArn, sourceArn) => {
  const container = new lambdaNodejs.NodejsFunction(stack, 'ProxyFunction', {
    functionName: `${stack.stackName}-proxy`,
    runtime: lambda.Runtime.NODEJS_LATEST,
    entry: path.join(process.cwd(), 'lib', 'functions', 'proxy', 'index.js'),
    handler: 'handler',
    timeout: cdk.Duration.seconds(15),
    memorySize: 512,
    environment: {
      ENV: stack.appContext.envName,
      NODE_OPTIONS: '--enable-source-maps',
    },
    bundling: {
      externalModules: ['@aws-sdk/*'],
      nodeModules: ['@napi-rs/canvas', 'sharp'],
      loader: { '.json': 'json' },
      sourceMap: true,
      commandHooks: {
        beforeBundling(inputDir, outputDir, init = []) { return init; },
        beforeInstall(inputDir, outputDir, init = []) { return init; },
        afterBundling(inputDir, outputDir) {
          return [
            `rm -f ${outputDir}/package-lock.json`,
          ];
        },
      },
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
