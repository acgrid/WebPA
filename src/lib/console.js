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
        this.panels = new Map();
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
        if(this.hasWindow(name)){
            this.panels.get(name).front(); // created already
            return;
        }
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
        const panel = this.createWindow(params);
        this.panels.set(name, panel);
        return panel;
    }
    confirm(question, onYes)
    {
        this.openWindow('confirm', {
            theme:       'danger',
            headerTitle: '确认',
            position:    'center-top 0 30',
            contentSize: '240 60',
            content: `<div class="controls">${question || '确认要执行选定的操作？'}</div>`,
            headerControls:{
                minimize: "remove",
                normalize: "remove",
                maximize: "remove",
            },
            footerToolbar:
            '<button type="button" class="btn btn-danger btn-sm jsPanel-ftr-btn btn-confirm-yes"><i class="fa fa-check"></i> 确认</button>'+
            '<button type="button" class="btn btn-default btn-sm jsPanel-ftr-btn btn-confirm-no"><i class="fa fa-times"></i> 取消</button>',
            callback: function (panel) {
                $(panel.footer).on("click", "button.btn-confirm-yes", function(){
                    panel.close();
                    onYes();
                }).on("click", "button.btn-confirm-no", function(){
                    panel.close();
                });
            }
        });
    }
    alert(content, headerTitle = '提示', theme = 'danger')
    {
        content = `<div class="controls">${content}</div>`;
        this.openWindow('alert', {
            theme,
            headerTitle,
            content,
            autoclose: 2000,
            position:    'center-top 0 30',
            contentSize: '300 60',
            headerControls:{
                minimize: "remove",
                normalize: "remove",
                maximize: "remove",
            }
        });
    }
}
module.exports = Console;