import * as cdk from 'aws-cdk-lib/core';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { route as ipRoute } from './route-ip.js';
import { route as proxyRoute } from './route-proxy.js';

export const serverlessGateway = stack => {
  const { gateway } = stack.context;
  const httpApi = new apigwv2.CfnApi(stack, 'HttpApi', {
    name: `${stack.stackName}-api`,
    protocolType: 'HTTP',
    disableExecuteApiEndpoint: true,
    corsConfiguration: {
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'HEAD'],
      allowHeaders: ['Content-Type'],
    },
  });

  const integrationArn = 'arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations';
  const sourceArn = cdk.Fn.sub(
    'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiId}/*/*/*', {
      ApiId: httpApi.ref,
    },
  );

  ipRoute(stack, { httpApi, integrationArn, sourceArn });
  proxyRoute(stack, { httpApi, integrationArn, sourceArn });

  const httpApiStage = new apigwv2.CfnStage(stack, 'HttpApiStage', {
    apiId: httpApi.ref,
    stageName: '$default',
    autoDeploy: true,
  });

  const certificateArn = cdk.Fn.sub(
    'arn:${AWS::Partition}:acm:${AWS::Region}:${AWS::AccountId}:certificate/${CertificateId}',
    { CertificateId: gateway.certificateId },
  );
  const httpApiDomainName = new apigwv2.CfnDomainName(stack, 'HttpApiDomainName', {
    domainName: gateway.domainName,
    domainNameConfigurations: [{
      endpointType: 'REGIONAL',
      securityPolicy: 'TLS_1_2',
      certificateArn,
    }],
  });

  const httpApiApiMapping = new apigwv2.CfnApiMapping(stack, 'HttpApiApiMapping', {
    apiId: httpApi.ref,
    domainName: httpApiDomainName.ref,
    stage: httpApiStage.stageName,
  });
  httpApiApiMapping.node.addDependency(httpApiStage);

  new cdk.CfnOutput(stack, 'Serverless HttpApiEndpoint', {
    value: httpApi.attrApiEndpoint,
    description: 'HTTP API endpoint',
  });
  new cdk.CfnOutput(stack, 'Serverless CustomDomain CNAME', {
    value: httpApiDomainName.attrRegionalDomainName,
    description: 'Custom domain CNAME',
  });
  new cdk.CfnOutput(stack, 'Serverless CustomDomain Endpoint', {
    value: cdk.Fn.join('', ['https://', httpApiDomainName.domainName]),
    description: 'Custom domain endpoint',
  });
  new cdk.CfnOutput(stack, 'Serverless Domainname', {
    value: cdk.Fn.join(' ', [
      '-e TYPE=CNAME',
      `-e DOMAIN="${httpApiDomainName.domainName.replace('.jsx.jp', '')}"`,
      `-e R_DATA="${httpApiDomainName.attrRegionalDomainName}."`,
    ]),
    description: 'Front custom domain CNAME',
  });

  return { httpApiDomainName };
};
