package com.myorg;

import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Map;
import java.util.HashMap;

import software.amazon.awscdk.core.Construct;
import software.amazon.awscdk.core.Stack;
import software.amazon.awscdk.core.StackProps;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.VersionOptions;
import software.amazon.awscdk.services.cloudfront.Behavior;
import software.amazon.awscdk.services.cloudfront.CloudFrontAllowedMethods;
import software.amazon.awscdk.services.cloudfront.CloudFrontWebDistribution;
import software.amazon.awscdk.services.cloudfront.CustomOriginConfig;
import software.amazon.awscdk.services.cloudfront.LambdaEdgeEventType;
import software.amazon.awscdk.services.cloudfront.LambdaFunctionAssociation;
import software.amazon.awscdk.services.cloudfront.OriginProtocolPolicy;
import software.amazon.awscdk.services.cloudfront.PriceClass;
import software.amazon.awscdk.services.cloudfront.SourceConfiguration;
import software.amazon.awscdk.services.cloudfront.CfnDistribution.ForwardedValuesProperty;

public class NowtvCfStack extends Stack {
    public NowtvCfStack(final Construct parent, final String id) {
        this(parent, id, null);
    }

    public NowtvCfStack(final Construct parent, final String id, final StackProps props) {
        super(parent, id, props);

        final String nginxHeaderKey = "891117e76cf925a5349fe8fc6e3ee8f3";
        final String nginxDomain = "nginxhk.compasshost.com";

        Function authFunction = Function.Builder.create(this, "authHandler")
            .runtime(Runtime.NODEJS_12_X)
            .code(Code.fromAsset("lambda"))
            .handler("auth.handler")
            .currentVersionOptions(VersionOptions.builder().description("auth:" + Calendar.getInstance().getTimeInMillis()).build())
            .build();

        //Bucket sourceBucket = new Bucket(this, "nowtvBucket");
        //S3OriginConfig originConfig = S3OriginConfig.builder().s3BucketSource(sourceBucket).build();
        CustomOriginConfig customOriginConfig = CustomOriginConfig.builder()
            .domainName(nginxDomain)
            .originProtocolPolicy(OriginProtocolPolicy.HTTPS_ONLY)
            .build();

        List<LambdaFunctionAssociation> assoList = new ArrayList<>();
        assoList.add(LambdaFunctionAssociation.builder().eventType(LambdaEdgeEventType.VIEWER_REQUEST).lambdaFunction(authFunction.getCurrentVersion()).build());

        List<Behavior> behaviors = new ArrayList<>();
        behaviors.add(Behavior.builder().isDefaultBehavior(true)
            .forwardedValues(ForwardedValuesProperty.builder()
                .headers(Arrays.asList("Access-Control-Request-Headers","Access-Control-Request-Method","Origin"))
                .queryString(false).build())
            .allowedMethods(CloudFrontAllowedMethods.GET_HEAD_OPTIONS)
            .lambdaFunctionAssociations(assoList).build());

        Map<String, String> customHeaders = new HashMap<>();
        customHeaders.put("nowe-cf-key", nginxHeaderKey);

        List<SourceConfiguration> sourceList = new ArrayList<>();
        sourceList.add(SourceConfiguration.builder()
            .customOriginSource(customOriginConfig)
            .originHeaders(customHeaders)
            .behaviors(behaviors).build());

        // Build the Cloudfront Distribution
        CloudFrontWebDistribution.Builder.create(this, "nowtvDistribution")
            .originConfigs(sourceList)
            .priceClass(PriceClass.PRICE_CLASS_ALL)
            .build();
        
    }
}
