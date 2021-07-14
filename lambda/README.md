### Lambda@Edge deployment mode
1. Clone this github repo and cd to lambda directory.
2. Modify the lambda function in auth.js so that it suits your need, for example you may want other signing algorithm, just replace the sample codes with yours.
3. Run "sam deploy -g" to deploy the Lambda function to us-east-1 region.
4. In your CloudFront distribution, modify the origin to include the Lambda to run at viewer request stage. Save the config and wait for the changes to propagate.
