## Cookieless Token AuthN/AuthZ Solution for HLS/DASH Streaming via Amazon CloudFront

### Why need this solution?

Live video streams are usually delivered via HLS or DASH with two levels of content protection: 1) DRM encryption, 2) Token based authN/AuthZ. When the player in web/mobile application played the HLS streams, it downloaded the .m3u8 manifest file and played the .ts video segments listed inside the manifest. Token based auth can be implemented in CloudFront via signed cookies, as player automatically included the signed cookie for every manifest and segment GET requests to the same host. However if the frontend player cannot enable cookies for whatever reason, using signed URL will not work because the signed token appended to the manifest’s URL isn't automatically appended to the segment file URLs inside the manifest.

### Description of the solution

The core ideas:
- Your application will generate a HMAC token for the master manifest using URL path, user’s IP, expiry time and a shared secret key. When the requests arrived at CloudFront, a NodeJS function in Lambda@Edge will verify the token by generating the HMAC again from the shared secret key.
- The HMAC token is placed in the URL path, not as a query parameter. There is no need to append the tokens to the segment URLs in manifests, as each subsequent manifest / segment requests will carry the parent URL path, which already includes the HMAC token.

Example:
> When an authorized user requests /Content/manifest.m3u8, your application will generate a HMAC token “abcd1234” and modify the request to /Content/abcd1234/manifest.m3u8. When CloudFront received the request at viewer request stage, Lambda@Edge function will generate the HMAC from the shared secret and check if it matches “abcd1234”. The function then modifies the request to /Content/manifest.m3u8 before requesting origin. After the frontend player gets the m3u8 file, it will request segment file with /Content/abcd1234/segment01.ts from CloudFront, and the same process repeats for the segment request.

### How to use the solution?

There are two deployment modes for this solution:
- Lambda@Edge
- CloudFront Functions

[CloudFront Functions](https://aws.amazon.com/about-aws/whats-new/2021/05/cloudfront-functions/) was released in May, 2021, which offers much lower per request cost than Lambda@Edge and scale much better, therefore CloudFront Functions is the prefered mode.

#### Lambda@Edge deployment mode
1. Clone this github repo and cd to lambda directory.
2. Modify the lambda function in auth.js so that it suits your need, for example you may want other signing algorithm, just replace the sample codes with yours.
3. Run "sam deploy -g" to deploy the Lambda function to us-east-1 region.
4. In your CloudFront distribution, modify the origin to include the Lambda to run at viewer request stage. Save the config and wait for the changes to propagate.

#### CloudFront Functions deployment mode
1. Clone this github repo and cd to function directory.
2. Modify the index.js file so that it suits your need, for exmaple you may want other signing algorithm, just replace the sample codes with yours.
3. Goto AWS console --> CloudFront --> CloudFront functions, copy the codes from index.js to the in-screen editor there.
4. Test the codes, move it from stage to production and deploy it to the target Cloudfront distribution.
