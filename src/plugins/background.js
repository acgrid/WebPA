const DOM = require('./dom'),
    $ = require('jquery'),
    Storage = require('../lib/storage');
const
    EVENT_GLOBAL_UPDATE_URL = "global.plugin.background.update",
    EVENT_GLOBAL_UPDATE_POP = "global.plugin.background.pop",
    EVENT_GLOBAL_HIDE = "global.plugin.background.hide",
    EVENT_SANDBOX_UPDATE_URL = "sandbox.background.image.update",
    EVENT_SANDBOX_HIDE = "sandbox.background.image.hide",
    STORAGE_BACKGROUND_URL = "plugin.background.url";

const FileType = /png|jpe?g|gif/i;

function setFileIcon($icon, extension){
    if(FileType.test(extension)){
        $icon.removeClass("fa-file").addClass("fa-file-image");
    }
}

class Background extends DOM{
    static name(){
        return 'background';
    }
    constructor(options = {}){
        super('background');
        this.className = options.className || 'background';
        this.$dom = $(`<div class="full"></div>`).addClass(this.className);
    }
    createDOM(){
        return this.$dom;
    }
    myInit(type, main, event){
        this.event = event;
        this.stack = [];
        event.on(EVENT_SANDBOX_UPDATE_URL, (data) => {
            this.$dom.removeClass("hidden").css("background-image", data.url ? `url("${data.url}")` : "");
        });
        event.on(EVENT_SANDBOX_HIDE, () => {
            this.$dom.addClass('hidden');
        });
        if(type === 'console'){
            this.url = Storage.get(STORAGE_BACKGROUND_URL, `http://127.0.0.1:8080/${main.channel}/KV.png`);
            this.$form = $(`<div class="controls"><div><input type="url" class="form-control" id="background-image-url" /></div><div class="btn-group window-padding-top"><button class="btn btn-primary" id="bg-set"><i class="fa fa-fw fa-eye"></i></button><button class="btn btn-danger" id="bg-hide"><i class="fa fa-fw fa-eye-slash"></i></button></div></div>`);
            this.$url = this.$form.find("input");
            this.$form.find("#bg-set").click(() => {
                this.setUrl(this.$url.val());
            });
            this.$form.find("#bg-hide").click(ev => {
                this.hide();
            });
            event.on(EVENT_GLOBAL_UPDATE_URL, (data) => {
                const url = data.url || "";
                this.$url.val(url);
                if(data.initial) this.stack.push(url);
                Storage.set(STORAGE_BACKGROUND_URL, url);
                event.emit(EVENT_SANDBOX_UPDATE_URL, data);
            });
            event.on(EVENT_GLOBAL_UPDATE_POP, (data) => {
                this.resetUrl(data.initial || true);
            });
            event.on(EVENT_GLOBAL_HIDE, (data) => {
                event.emit(EVENT_SANDBOX_HIDE, data);
            });
            // Register processor
            event.on("plugin.file.icon.*", setFileIcon);
            event.on("plugin.file.operation.*", this.setFileOperation.bind(this));
            event.on("plugin.program.file.select", (files, selected) => {
                for(let file of files){
                    if(FileType.test(file.extension)){
                        selected.image = file.url;
                        return;
                    }
                }
            });
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-image");
                    $icon.find("p").text("背景图");
                    $icon.click(() => {
                        main.openWindow('background-setup', {
                            theme:       'primary',
                            headerTitle: '背景图',
                            position:    'center-top 0 30',
                            contentSize: '450 250',
                            content:     this.$form.get(0)
                        });
                    });
                    return $icon;
                });
            });
            event.on("enter", (params) => {
                if(params.role === 'monitor') this.setUrl(this.url);
            });
            this.setUrl(this.url);
        }
    }
    setUrl(url, initial = true){
        this.event.emit(EVENT_GLOBAL_UPDATE_URL, {url, initial});
    }
    hide(initial = true){
        this.event.emit(EVENT_GLOBAL_HIDE, {initial});
    }
    resetUrl(initial = true){
        if(this.stack.length > 1){
            this.stack.pop();
            this.event.emit(EVENT_GLOBAL_UPDATE_URL, {url: this.stack[this.stack.length - 1], initial});
        }
    }
    setUrlFromDOM(ev){
        this.setUrl($(ev.target).closest(".file-entry").data("url"));
    }
    setFileOperation($cell, extension){
        if(FileType.test(extension)){
            const $button = $('<button class="btn btn-primary btn-sm"><i class="fa fa-fw fa-image" title="设置背景"></i></button>');
            $button.click(this.setUrlFromDOM.bind(this));
            $cell.append($button);
        }
    }
}

module.exports = Background;
module.exports.GlobalUpdateBackgroundUrl = EVENT_GLOBAL_UPDATE_URL;
module.exports.SandboxUpdateBackgroundUrl = EVENT_SANDBOX_UPDATE_URL;