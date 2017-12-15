const fs = require('fs'),
    debug = require('debug')('webpa:media'),
    config = require('config').get('media');

module.exports = {
    list(channel){
        debug(config.local);
        return new Promise((resolve, reject) => {
            fs.readdir(config.local + channel, (err, files) => {
                err ? reject(err) : resolve(files);
            });
        });
    }
};