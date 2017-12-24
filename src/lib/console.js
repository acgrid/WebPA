const $ = require('jquery'),
    Main = require('./main'),
    stoarge = require('../lib/storage'),
    ev = require('../lib/event');

const $icon = $('<div class="icon-container"><div class="icon"><i class="fa fa-4x fa-fw"></i><p></p></div></div>');

function scrollTableBody(){
    // this should be a table.scroll jQuery object
    const setHeight = () => {
        const $panel = this.closest(".jsPanel-content"), $scrollBody = $panel.find(".dataTables_scrollBody");
        $scrollBody.css("max-height", $panel.height() - ($scrollBody.offset().top - $panel.offset().top) - 30);
    };
    if($.fn.dataTable.isDataTable(this)){
        this.DataTable().draw();
        setHeight();
    }else{
        let options = this.data("DataTableOptions") || {};
        options.scrollY = '100px';
        options.scrollCollapse = true;
        options.paging = false;
        options.drawCallback = setHeight;
        this.DataTable(options);
    }

}

class Console extends Main{
    constructor(channel, desktop, plugins){
        stoarge.channel(channel);
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
            document.addEventListener('jspanelloaded', (event) => {
                ev.emit("console.window.loaded", $(`#${event.detail}`));
            });
            $('body').on("mouseenter", "input[type=number]", function(ev){
                this.focus();
                ev.target.select();
            });
            ev.on("console.window.loaded", ($window) => {
                const $table = $window.find("table.scroll");
                if($table.length) scrollTableBody.apply($table);
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
        if(params.content instanceof HTMLElement){
            const $table = $(params.content).find("table.scroll");
            if($table.length){
                params.resizeit = params.resizeit || {};
                params.resizeit.resize = scrollTableBody.bind($table);
            }
        }
        this.windows.add(name);
        return this.createWindow(params);
    }
}
module.exports = Console;