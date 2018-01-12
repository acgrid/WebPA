const fs = require('fs'),
    hashFiles = require('hash-files'),
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
    },
    hash(channel, beforeHash = null, afterHash = null){
        return new Promise((resolve, reject) => {
            this.list(channel).then(files => {
                let left = files.length;
                const hashMap = {};
                files.forEach(file => {
                    if(beforeHash) beforeHash(file);
                    hashFiles({
                        files: [`${config.local}${channel}/${file}`],
                        algorithm: 'sha1'
                    }, (error, hash) => {
                        if(error){
                            reject(error);
                        }else{
                            if(afterHash) afterHash(file, hash);
                            hashMap[hash] = file;
                            if(--left === 0) resolve(hashMap);
                        }
                    });
                });
            });
        });
    },
    rename(channel, from, to, cb){
        fs.rename(`${config.local}${channel}/${from}`, `${config.local}${channel}/${to}`, cb);
    },
    download(channel, url, filename, cb){
        require('request').get(url, cb).pipe(fs.createWriteStream(`${config.local}${channel}/${filename}`));
    }
};