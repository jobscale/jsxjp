import * as cdk from 'aws-cdk-lib/core';
import * as fs from 'node:fs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'node:path';

export const frontCache = stack => {
  const { front, gateway } = stack.context;
  const destinationBucket = new s3.Bucket(stack, 'FrontBucket', {
    bucketName: `${front.bucketName}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    encryption: s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  });

  const certificate = acm.Certificate.fromCertificateArn(stack, 'FrontCertificate',
    cdk.Fn.sub(
      'arn:${AWS::Partition}:acm:us-east-1:${AWS::AccountId}:certificate/${CertificateId}',
      { CertificateId: front.certificateId },
    ),
  );

  const rewriteFunction = new cloudfront.Function(stack, 'FrontRewriteFunction', {
    functionName: `${stack.stackName}-rewrite`,
    runtime: cloudfront.FunctionRuntime.JS_2_0,
    comment: 'Append index.html for directory-style URIs',
    code: cloudfront.FunctionCode.fromInline(
      fs.readFileSync(path.join(process.cwd(), 'lib', 'cdk', 'front-rewrite.cjs'), 'utf8'),
    ),
  });

  const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(destinationBucket);
  const httpApiOrigin = new origins.HttpOrigin(gateway.domainName, {
    protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2],
  });

  const s3Behavior = (extras = {}) => ({
    origin: s3Origin,
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    compress: true,
    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    ...extras,
  });

  const distribution = new cloudfront.Distribution(stack, 'FrontDistribution', {
    enabled: true,
    defaultRootObject: 'index.html',
    domainNames: [front.domainName],
    certificate,
    minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    sslSupportMethod: cloudfront.SSLMethod.SNI,
    defaultBehavior: {
      origin: httpApiOrigin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      compress: true,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
    },
    additionalBehaviors: {
      '/v1/*': s3Behavior({
        functionAssociations: [{
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          function: rewriteFunction,
        }],
      }),
      '/index.html': s3Behavior(),
      '/favicon.ico': s3Behavior(),
      '/manifest.json': s3Behavior(),
      '/pwa.js': s3Behavior(),
      '/service-worker.js': s3Behavior(),
      '/robots.txt': s3Behavior(),
      '/sitemap.txt': s3Behavior(),
    },
  });

  new s3deploy.BucketDeployment(stack, 'FrontDocsDeploy', {
    sources: [s3deploy.Source.asset(path.join(process.cwd(), 'lib/functions/proxy/docs'))],
    destinationBucket,
    distribution,
    distributionPaths: ['/*'],
  });

  new cdk.CfnOutput(stack, 'Front BucketName', {
    value: destinationBucket.bucketName,
    description: 'Static content S3 bucket name',
  });
  new cdk.CfnOutput(stack, 'Front CloudFront CNAME', {
    value: distribution.distributionDomainName,
    description: 'CloudFront distribution domain for CNAME',
  });
  new cdk.CfnOutput(stack, 'Front Endpoint', {
    value: cdk.Fn.join('', ['https://', front.domainName]),
    description: 'Front custom domain endpoint',
  });
  new cdk.CfnOutput(stack, 'Front Domainname', {
    value: cdk.Fn.join(' ', [
      'TYPE=CNAME',
      `DOMAIN="${front.domainName.replace('.jsx.jp', '')}"`,
      `R_DATA="${distribution.distributionDomainName}."`,
    ]),
    description: 'Front custom domain CNAME',
  });
};
