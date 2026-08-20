import * as cdk from 'aws-cdk-lib/core';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'node:path';

export const frontCache = (stack, front) => {
  const frontBucket = new s3.Bucket(stack, 'FrontBucket', {
    bucketName: `${front.bucketName}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    encryption: s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  });

  const frontCertificateArn = cdk.Fn.sub(
    'arn:${AWS::Partition}:acm:us-east-1:${AWS::AccountId}:certificate/${CertificateId}',
    { CertificateId: front.certificateId },
  );

  const frontOriginAccessControl = new cloudfront.CfnOriginAccessControl(stack, 'FrontOriginAccessControl', {
    originAccessControlConfig: {
      name: `${stack.stackName}-front-oac`,
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    },
  });

  const frontDistribution = new cloudfront.CfnDistribution(stack, 'FrontDistribution', {
    distributionConfig: {
      enabled: true,
      defaultRootObject: 'index.html',
      aliases: [front.domainName],
      viewerCertificate: {
        acmCertificateArn: frontCertificateArn,
        sslSupportMethod: 'sni-only',
        minimumProtocolVersion: 'TLSv1.2_2021',
      },
      origins: [{
        id: 'FrontS3Origin',
        domainName: frontBucket.bucketRegionalDomainName,
        originAccessControlId: frontOriginAccessControl.attrId,
        s3OriginConfig: {},
      }],
      defaultCacheBehavior: {
        targetOriginId: 'FrontS3Origin',
        viewerProtocolPolicy: 'redirect-to-https',
        compress: true,
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },
      },
    },
  });

  frontBucket.addToResourcePolicy(new iam.PolicyStatement({
    sid: 'AllowCloudFrontServiceRead',
    actions: ['s3:GetObject'],
    resources: [frontBucket.arnForObjects('*')],
    principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
    conditions: {
      StringEquals: {
        'AWS:SourceArn': cdk.Fn.sub(
          'arn:${AWS::Partition}:cloudfront::${AWS::AccountId}:distribution/${DistributionId}',
          { DistributionId: frontDistribution.ref },
        ),
      },
    },
  }));

  new s3deploy.BucketDeployment(stack, 'FrontDocsDeploy', {
    sources: [s3deploy.Source.asset(path.join(process.cwd(), 'docs'))],
    destinationBucket: frontBucket,
    distribution: cloudfront.Distribution.fromDistributionAttributes(stack, 'FrontDistributionRef', {
      distributionId: frontDistribution.ref,
      domainName: frontDistribution.attrDomainName,
    }),
    distributionPaths: ['/*'],
  });

  new cdk.CfnOutput(stack, 'FrontBucketName', {
    value: frontBucket.bucketName,
    description: 'Static content S3 bucket name',
  });
  new cdk.CfnOutput(stack, 'FrontCloudFrontCNAME', {
    value: frontDistribution.attrDomainName,
    description: 'CloudFront distribution domain for CNAME',
  });
  new cdk.CfnOutput(stack, 'FrontEndpoint', {
    value: cdk.Fn.join('', ['https://', front.domainName]),
    description: 'Front custom domain endpoint',
  });
};
