import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
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

    this.context = {
      envName,
      ...stackProps,
    };
    logger.info({
      stackName: this.stackName,
      env: this.env,
      context: this.context,
    });

    this.context.vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [{
        name: 'public',
        subnetType: ec2.SubnetType.PUBLIC,
      }],
    });

    serverlessGateway(this);
    frontCache(this);
  }
}
