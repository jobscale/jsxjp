import * as cdk from 'aws-cdk-lib/core';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { route as routeIp } from './cdk/route-ip.js';
import { route as routeWelcome } from './cdk/route-welcome.js';

export class CdkServerlessStack extends cdk.Stack {
  constructor(scope, id, props = {}) {
    const { envName = 'dev', ...stackProps } = props;
    super(scope, id, stackProps);

    cdk.Tags.of(this).add('Env', envName, {
      excludeResourceTypes: ['AWS::ApiGatewayV2::Api'],
    });

    const integrationArn = 'arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations';
    const httpApi = new apigwv2.CfnApi(this, 'HttpApi', {
      name: `${this.stackName}-api`,
      protocolType: 'HTTP',
      disableExecuteApiEndpoint: true,
      corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'HEAD'],
        allowHeaders: ['Content-Type'],
      },
    });

    const sourceArn = cdk.Fn.sub(
      'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiId}/*/*/*', {
        ApiId: httpApi.ref,
      },
    );

    routeIp(this, httpApi, envName, integrationArn, sourceArn);
    routeWelcome(this, httpApi, envName, integrationArn, sourceArn);

    const httpApiStage = new apigwv2.CfnStage(this, 'HttpApiStage', {
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

    const httpApiApiMapping = new apigwv2.CfnApiMapping(this, 'HttpApiApiMapping', {
      apiId: httpApi.ref,
      domainName: httpApiDomainName.ref,
      stage: httpApiStage.stageName,
    });
    httpApiApiMapping.node.addDependency(httpApiStage);

    new cdk.CfnOutput(this, 'HttpApiEndpoint', {
      value: cdk.Fn.join('', [httpApi.attrApiEndpoint, '/ip']),
      description: 'HTTP API endpoint for /ip',
    });
    new cdk.CfnOutput(this, 'CustomDomain CNAME', {
      value: httpApiDomainName.attrRegionalDomainName,
      description: 'Custom domain CNAME',
    });
    new cdk.CfnOutput(this, 'CustomDomainEndpoint', {
      value: cdk.Fn.join('', ['https://', httpApiDomainName.domainName, '/ip']),
      description: 'Custom domain endpoint for /ip',
    });
  }
}
