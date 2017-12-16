const $ = require('jquery'),
    Main = require('./main'),
    ev = require('../lib/event');

const $icon = $('<div class="icon-container"><div class="icon"><i class="fa fa-4x fa-fw"></i><p></p></div></div>');

class Console extends Main{
    constructor(channel, desktop, plugins){
        super('console', plugins, {channel, desktop}, (ev) => {
            ev.emit("console.build");
        });
        this.windows = new Set();
    }
    get channel(){
        return this.data.channel;
    }
    get desktop(){
        return this.data.desktop;
    }
    start(){
        super.start((ev) => {
            document.addEventListener('jspanelclosed', (event) => {
                ev.emit('debug', `Window ${event.detail} is closed`);
                this.windows.delete(event.detail);
            });
            $('body').on("mouseenter", "input[type=number]", function(ev){
                this.focus();
                ev.target.select();
            });
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
    hasWindow(name){
        return this.windows.has(name);
    }
    openWindow(name, params){
        if(this.hasWindow(name)) return; // created already
        if(typeof params === "function") params = params() || null;
        if(!params) return;
        params.id = name;
        this.windows.add(name);
        return this.createWindow(params);
    }
}
module.exports = Console;