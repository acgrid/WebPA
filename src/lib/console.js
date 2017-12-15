const $ = require('jquery'),
    Main = require('./main'),
    ev = require('../lib/event');

const $icon = $('<div class="icon-container"><div class="icon"><i class="fa fa-4x fa-fw"></i><p></p></div></div>');

class Console extends Main{
    constructor(channel, desktop, plugins){
        super('console', plugins, {channel, desktop}, (ev) => {
            ev.emit("console.build");
        });
    }
    get channel(){
        return this.data.channel;
    }
    get desktop(){
        return this.data.desktop;
    }
    start(){
        super.start((ev) => {

        });
    }
    stop(){
        super.stop((ev) => {

        });
    }
    createIcon(callback){
        let $thisIcon = callback($icon.clone());
        if($thisIcon) this.desktop.append($thisIcon);
    }
    createWindow(params){
        return jsPanel.create(params);
    }
}
module.exports = Console;