import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import path from 'path';

export class CdkServerlessStack extends cdk.Stack {
  constructor(scope, id, props = {}) {
    const { envName = 'dev', ...stackProps } = props;
    super(scope, id, stackProps);

    cdk.Tags.of(this).add('Env', envName, {
      excludeResourceTypes: ['AWS::ApiGatewayV2::Api'],
    });

    const helloFunction = new lambdaNodejs.NodejsFunction(this, 'HelloFunction', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      entry: path.join(process.cwd(), 'lib', 'functions', 'hello', 'index.js'),
      handler: 'handler',
      environment: {
        ENV: envName,
      },
    });

    const welcomeFunction = new lambdaNodejs.NodejsFunction(this, 'WelcomeFunction', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      entry: path.join(process.cwd(), 'lib', 'functions', 'user', 'welcome', 'index.js'),
      handler: 'handler',
      environment: {
        ENV: envName,
      },
    });

    const integrationArn = 'arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations';
    const httpApi = new apigwv2.CfnApi(this, 'HttpApi', {
      body: {
        openapi: '3.0.1',
        info: {
          title: `${this.stackName} API`,
          version: '1.0',
        },
        servers: [{
          url: 'https://serverless.jsx.jp',
          'x-amazon-apigateway-endpoint-configuration': {
            disableExecuteApiEndpoint: true,
          },
        }],
        paths: {
          '/hello': {
            get: {
              operationId: 'hello',
              responses: {
                200: {
                  description: '200 OK',
                },
              },
              'x-amazon-apigateway-integration': {
                type: 'AWS_PROXY',
                payloadFormatVersion: '2.0',
                uri: cdk.Fn.sub(
                  integrationArn, {
                    LambdaArn: helloFunction.functionArn,
                  },
                ),
              },
            },
          },
          '/user/welcome': {
            get: {
              operationId: 'userWelcome',
              responses: {
                200: {
                  description: '200 OK',
                },
              },
              'x-amazon-apigateway-integration': {
                type: 'AWS_PROXY',
                payloadFormatVersion: '2.0',
                uri: cdk.Fn.sub(
                  integrationArn, {
                    LambdaArn: welcomeFunction.functionArn,
                  },
                ),
              },
            },
          },
        },
      },
    });

    new apigwv2.CfnStage(this, 'HttpApiStage', {
      apiId: httpApi.ref,
      stageName: '$default',
      autoDeploy: true,
    });

    const certificateArn = cdk.Fn.sub(
      'arn:${AWS::Partition}:acm:${AWS::Region}:${AWS::AccountId}:certificate/${CertificateId}',
      { CertificateId: stackProps.certificateId },
    );
    const httpApiDomainName = new apigwv2.CfnDomainName(this, 'HttpApiDomainName', {
      domainName: stackProps.domainName,
      domainNameConfigurations: [{
        endpointType: 'REGIONAL',
        securityPolicy: 'TLS_1_2',
        certificateArn,
      }],
    });

    new apigwv2.CfnApiMapping(this, 'HttpApiApiMapping', {
      apiId: httpApi.ref,
      domainName: httpApiDomainName.ref,
      stage: '$default',
    });

    const sourceArn = cdk.Fn.sub(
      'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiId}/*/*/*', {
        ApiId: httpApi.ref,
      },
    );
    [
      helloFunction, welcomeFunction,
    ].forEach(fn => {
      fn.addPermission('HttpApiInvokePermission', {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        action: 'lambda:InvokeFunction',
        sourceArn,
      });
    });

    new cdk.CfnOutput(this, 'HttpApiEndpoint', {
      value: cdk.Fn.join('', [httpApi.attrApiEndpoint, '/hello']),
      description: 'HTTP API endpoint for /hello',
    });
    new cdk.CfnOutput(this, 'CustomDomain CNAME', {
      value: httpApiDomainName.attrRegionalDomainName,
      description: 'Custom domain CNAME',
    });
    new cdk.CfnOutput(this, 'CustomDomainEndpoint', {
      value: cdk.Fn.join('', ['https://', httpApiDomainName.domainName, '/hello']),
      description: 'Custom domain endpoint for /hello',
    });
  }
}
