const $ = require('jquery'),
    Main = require('./main'),
    stoarge = require('../lib/storage'),
    ev = require('../lib/event');

class Monitor extends Main{
    constructor(channel, sandbox, plugins = []){
        stoarge.channel(channel);
        super('monitor', plugins, {channel, sandbox}, (ev) => {

        });
    }
    get channel(){
        return this.data.channel;
    }
    get sandbox(){
        return this.data.sandbox;
    }
    start(){
        super.start((ev) => {
            ev.emit("sandbox.create", this.data.sandbox);
        });
    }
    stop(){
        super.stop((ev) => {
            //
        });
    }
}
module.exports = Monitor;