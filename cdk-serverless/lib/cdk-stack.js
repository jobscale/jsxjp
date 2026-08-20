import * as cdk from 'aws-cdk-lib/core';
import { serverlessGateway } from './cdk/serverless.js';
import { frontCache } from './cdk/front.js';

export class CdkStack extends cdk.Stack {
  constructor(scope, id, props = {}) {
    const { envName = 'dev', ...stackProps } = props;
    super(scope, id, stackProps);

    cdk.Tags.of(this).add('Env', envName, {
      excludeResourceTypes: ['AWS::ApiGatewayV2::Api'],
    });

    serverlessGateway(this, stackProps.gateway);
    frontCache(this, stackProps.front);
  }
}
