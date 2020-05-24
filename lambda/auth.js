'use strict';

exports.handler = async (event, context, callback) => {
    // Encryption secret
    const secret = 'abcdef123456';
    const mediaExtArray = 'm3u8;mpd;m4v;m4a;ts;mp4'.split(';');

    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Check for file ext that need token authorization
    const fileExt = mediaExtArray.find((ext) => {return request.uri.endsWith('.' + ext)});

    if (typeof fileExt === 'undefined') {
        console.log('File not require token auth, go direct to cloudfront');
        callback(null, request);
        return;
    } else {
        console.log(`${fileExt} request found, continue to token validation`);
    }

    let forBiddenResponse = {
        status: '403',
        statusDescription: 'Forbidden'
    };

    const urlPath = request.uri.substring(0, request.uri.lastIndexOf('/'));
    const clientIp = request.clientIp;
    const inTokenString = urlPath.substring(urlPath.lastIndexOf('/') + 1);

    if(!inTokenString.includes('_')) {
        console.log('Token timestamp not found, return 403 fordbidden');
        callback(null, forBiddenResponse);
        return;
    }

    const inTokenArray = inTokenString.split('_');
    const inToken = inTokenArray[0];
    const expires = inTokenArray[1];
    const assetPath = 'https://' + headers.host[0].value + urlPath.substring(0, urlPath.lastIndexOf('/'));

    console.log(`assetPath: ${assetPath}`);
    console.log(`clientIp: ${clientIp}, expires: ${expires}`);
    console.log(`Input token: ${inToken}`);

    const inData = secret + assetPath + clientIp + expires;

    console.log('*** inData: ' + inData);

    const outToken = require('crypto').createHash('md5').update(inData).digest("hex");

    console.log(`Output token: ${outToken}`);

    if(inToken === outToken) {
        const currentTime = Math.floor(Date.now() / 1000);
        console.log('Token validation SUCCEED!, check if token expired, current time: ' + currentTime);

        if (currentTime < parseInt(expires)) {

            const fileName = request.uri.substring(request.uri.lastIndexOf('/') + 1);
            const cleanPath = urlPath.substring(urlPath.indexOf('/Content/')).replace(inTokenString, '');
            request.uri = cleanPath + fileName;

            console.log('Token not expired, pass request to Cloudfront');
            callback(null, request);

        } else {
            console.log('Token expired! return 403 forbidden');
            callback(null, forBiddenResponse);
        }
    } else {
        console.log('Token validation FAILED! return 403 forbidden');

        callback(null, forBiddenResponse);
    }

}