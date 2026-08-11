import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import path from 'path';

export const route = (stack, httpApi, envName, integrationArn, sourceArn) => {
  const welcomeFunction = new lambdaNodejs.NodejsFunction(stack, 'WelcomeFunction', {
    runtime: lambda.Runtime.NODEJS_LATEST,
    entry: path.join(process.cwd(), 'lib', 'functions', 'user', 'welcome', 'index.js'),
    handler: 'handler',
    environment: {
      ENV: envName,
    },
  });

  const welcomeIntegration = new apigwv2.CfnIntegration(stack, 'WelcomeIntegration', {
    apiId: httpApi.ref,
    integrationType: 'AWS_PROXY',
    integrationUri: cdk.Fn.sub(integrationArn, {
      LambdaArn: welcomeFunction.functionArn,
    }),
    payloadFormatVersion: '2.0',
    integrationMethod: 'POST',
  });

  new apigwv2.CfnRoute(stack, 'UserWelcomeRoute', {
    apiId: httpApi.ref,
    routeKey: 'GET /user/welcome',
    target: cdk.Fn.join('', ['integrations/', welcomeIntegration.ref]),
  });

  welcomeFunction.addPermission('HttpApiInvokePermission', {
    principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    action: 'lambda:InvokeFunction',
    sourceArn,
  });
};
