const $ = require('jquery'),
    Main = require('./main'),
    stoarge = require('../lib/storage'),
    ev = require('../lib/event');

class Light extends Main{
    constructor(channel, plugins = []){
        stoarge.channel(channel);
        super('light', plugins, {channel}, (ev) => {

        });
    }
    get channel(){
        return this.data.channel;
    }
    start(){
        super.start((ev) => {
            ev.emit("light.create");
        });
    }
    stop(){
        super.stop((ev) => {
            //
        });
    }
}
module.exports = Light;