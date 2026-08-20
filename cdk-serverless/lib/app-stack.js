import * as cdk from 'aws-cdk-lib/core';
import { serverlessGateway } from './cdk/serverless.js';
import { frontCache } from './cdk/front.js';

const logger = new Proxy(console, {
  get(target, prop) {
    return target[prop];
  },
});

export class AppStack extends cdk.Stack {
  constructor(scope, id, props = {}) {
    const { envName = 'dev', ...stackProps } = props;
    super(scope, id, stackProps);

    cdk.Tags.of(this).add('Env', envName, {
      excludeResourceTypes: ['AWS::ApiGatewayV2::Api'],
    });

    this.context = { envName };
    logger.info({
      stackName: this.stackName,
      env: this.env,
      context: this.context,
    });

    serverlessGateway(this, stackProps.gateway);
    frontCache(this, stackProps.front);
  }
}
