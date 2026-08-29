import * as cdk from 'aws-cdk-lib/core';
import { logger } from '@jobscale/create-logger';
import { serverlessGateway } from './cdk/serverless.js';
import { frontCache } from './cdk/front.js';

export class AppStack extends cdk.Stack {
  constructor(scope, id, props = {}) {
    const { envName = 'dev', ...stackProps } = props;
    super(scope, id, stackProps);

    cdk.Tags.of(this).add('Env', envName, {
      excludeResourceTypes: ['AWS::ApiGatewayV2::Api'],
    });

    this.context = {
      envName,
      ...stackProps,
    };
    logger.info({
      stackName: this.stackName,
      env: this.env,
      context: this.context,
    });

    serverlessGateway(this);
    frontCache(this);
  }
}
