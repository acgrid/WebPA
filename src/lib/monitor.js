const $ = require('jquery'),
    Main = require('./main'),
    ev = require('../lib/event');

/*$(function(){
    const v = document.getElementById('playback');
    const canvas = document.getElementById('overlay');
    const context = canvas.getContext('2d');

    canvas.width = v.clientWidth;
    canvas.height = v.clientHeight;
    context.strokeStyle = 'white';
    context.strokeRect(0, 0, v.clientWidth, v.clientHeight);
    context.strokeText('TEST3', 10, 10, 100);
});*/

class Monitor extends Main{
    constructor(channel, sandbox, plugins = []){
        super('monitor', plugins, {channel, sandbox}, (ev) => {
            // init here
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
            //
        });
    }
    stop(){
        super.stop((ev) => {
            //
        });
    }
}
module.exports = Monitor;