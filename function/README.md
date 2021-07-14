### CloudFront Functions deployment mode
1. Clone this github repo and cd to function directory.
2. Modify the index.js file so that it suits your need, for exmaple you may want other signing algorithm, just replace the sample codes with yours.
3. Goto AWS console --> CloudFront --> CloudFront functions, copy the codes from index.js to the in-screen editor there.
4. Test the codes, move it from stage to production and deploy it to the target Cloudfront distribution.
