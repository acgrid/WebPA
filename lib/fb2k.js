const config = require('config').get('fb2k'),
    debug = require('debug')('webpa:fb2k'),
    request = require('request-promise-native');

let recent = {};

function command(queries = {}, options = {}){
    options.url = config.url;
    options.method = "GET";
    options.qs = queries;
    options.json = true;
    options.auth = {
        username: config.username,
        password: config.password,
        sendImmediately: true
    };
    options.timeout = config.timeout;
    return request(options).then((data) => {
        recent.time = Date.now();
        recent.data = data;
        return new Promise((resolve) => {
            resolve(data);
        });
    });
}

module.exports = {
    play(listIndex, trackIndex){
        return command({cmd: 'SwitchPlaylist', param1: listIndex}).then(() => {
            return command({cmd: "Start", param1: trackIndex});
        });
    },
    pause(){
        return command({cmd: "PlayOrPause"});
    },
    stop(){
        return command({cmd: "Stop"});
    },
    seek(position){
        return command({cmd: 'Seek', param1: position});
    },
    volume(volume){
        return command({cmd: 'Volume', param1: volume});
    },
    info(){
        return new Promise((resolve, reject) => {
            const now = Date.now();
            if(recent.time && recent.data && now - recent.time < config.timeout){
                debug(`Use cached FB2K status at ${now}`);
                resolve(recent.data);
            }else{
                debug(`Update FB2K status at ${now}`);
                command().then((data) => {
                    resolve(data);
                }).catch((err) => {
                    reject(err);
                });
            }
        });
    }
};