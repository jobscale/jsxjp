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

    this.appContext = { envName };
    logger.info({
      stackEnv: this.envName ?? 'does not set envName',
      envName: this.appContext.envName,
      stackName: this.stackName,
      env: this.env,
    });

    serverlessGateway(this, stackProps.gateway);
    frontCache(this, stackProps.front);
  }
}
