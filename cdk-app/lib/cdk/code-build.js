import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as logs from 'aws-cdk-lib/aws-logs';

export const codeBuild = (stack, {
  owner = 'jobscale',
  repo = 'jsxjp',
  branch = 'main',
  buildspec,
} = {}) => {
  const source = codebuild.Source.gitHub({
    owner,
    repo,
    branchOrRef: branch,
  });

  const project = new codebuild.Project(stack, 'CodeBuildProject', {
    projectName: `${stack.stackName}-build`,
    source,
    environment: {
      buildImage: codebuild.LinuxBuildImage.STANDARD_8_0,
      computeType: codebuild.ComputeType.LARGE,
    },
    buildSpec: buildspec ?? codebuild.BuildSpec.fromObject({
      version: 0.2,
      phases: {
        install: {
          'runtime-versions': { nodejs: 26 },
          commands: [
            'apt-get update && apt-get install -y apt-transport-https git curl vim tmux jq',
            'npm version',
          ],
        },
        build: {
          commands: [
            '[ -z "$DEBUG" ] || codebuild-breakpoint',
            'npm run',
          ],
        },
      },
    }),
    environmentVariables: {
      ENV: { value: stack.context?.envName ?? 'dev' },
    },
    timeout: cdk.Duration.minutes(30),
    logging: {
      cloudWatch: {
        logGroup: new logs.LogGroup(stack, 'CodeBuildLogGroup', {
          logGroupName: `/aws/codebuild/${stack.stackName}-build`,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          retention: logs.RetentionDays.SIX_MONTHS,
        }),
      },
    },
  });

  // debug session (codebuild-breakpoint + ssm start-session)
  project.addToRolePolicy(new iam.PolicyStatement({
    actions: [
      'ssmmessages:CreateControlChannel',
      'ssmmessages:CreateDataChannel',
      'ssmmessages:OpenControlChannel',
      'ssmmessages:OpenDataChannel',
    ],
    resources: ['*'],
  }));

  new cdk.CfnOutput(stack, 'CodeBuildProjectName', {
    value: project.projectName,
  });

  return project;
};

export default { codeBuild };
