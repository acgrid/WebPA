const config = require('config').get('api'),
    crypt = require('crypto'),
    request = require('request-promise-native'),
    debug = require('debug')('api');

const url = config.get('prefix'),
    key = config.get('key'),
    credential = config.get("credential"),
    timeout = config.has('timeout') ? config.get('timeout') : 5000;

module.exports = function(endpoint, options = {}){
    const timestamp = Date.now(),
        hmac = crypt.createHmac('sha256', key);
    hmac.update(`${credential}:${timestamp}`);
    options.url = `${url}/${endpoint}`;
    options.json = true;
    options.timeout = options.timeout || timeout;
    if(!options.headers) options.headers = {};
    options.headers["X-RT-Credential"] = credential;
    options.headers["X-RT-Timestamp"] = timestamp;
    options.headers["X-RT-Signature"] = hmac.digest('hex');
    debug(options);
    return request(options);
};