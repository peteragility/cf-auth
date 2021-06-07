var crypto = require('crypto');

//Response when JWT is not valid.
var response401 = {
    statusCode: 401,
    statusDescription: 'Unauthorized'
}

function handler(event) {

    var request = event.request;
    var viewer = event.viewer;

    //Secret key used to verify signed token.
    //Update with your own key.
    var secret = '2f2584eb9266497e9ae3c20600f41fab';
    var signingMethod = 'sha256';
    var signingType = 'hmac';

    var urlPath = request.uri.substring(0, request.uri.lastIndexOf('/'));
    var inTokenString = urlPath.substring(urlPath.lastIndexOf('/') + 1);

    // Check if signed token in url path exists and is it included the timestamp mark
    if(!inTokenString.includes('_')) {
        console.log('Token timestamp not found, return 401');
        return response401;
    }

    var inTokenArray = inTokenString.split('_');
    var inToken = inTokenArray[0];
    var expires = inTokenArray[1];
    var clientIp = viewer.ip;
    var assetPath = 'https://' + request.headers.host.value + urlPath.substring(0, urlPath.lastIndexOf('/'));
    var signingInput = [assetPath, clientIp, expires].join(';');

    //console.log(`assetPath: ${assetPath}`);
    //console.log(`clientIp: ${clientIp}, expires: ${expires}`);
    console.log(`Input token: ${inToken}`);
    console.log('*** signingInput: ' + signingInput);

    try{ 
        if (!_verify(signingInput, secret, signingMethod, signingType, inToken)) {
            throw new Error('Signature verification failed');
        }

        if (Date.now() > parseInt(expires)*1000) {
            throw new Error('Token expired');
        }

    } catch(e) {
        console.log(e);
        return response401;
    }

    // Remove the token / sessionId in the path and pass to cloudfront
    var fileName = request.uri.substring(request.uri.lastIndexOf('/') + 1);
    var cleanPath = urlPath.substring(urlPath.indexOf('/Content/')).replace(inTokenString, '');
    request.uri = cleanPath + fileName;
    console.log('Token verification succeed! request.uri = ' + request.uri);

    return request;
}

function _verify(input, key, method, type, signature) {
    if(type === "hmac") {        
        return _constantTimeEquals(signature, _sign(input, key, method));
    }
    else {
        throw new Error('Algorithm type not recognized');
    }
}

function _sign(input, key, method) {
    return crypto.createHmac(method, key).update(input).digest('hex');
}

//Function to ensure a constant time comparison to prevent
//timing side channels.
function _constantTimeEquals(a, b) {
    if (a.length != b.length) {
        return false;
    }
    
    var xor = 0;
    for (var i = 0; i < a.length; i++) {
    xor |= (a.charCodeAt(i) ^ b.charCodeAt(i));
    }
    
    return 0 === xor;
}
