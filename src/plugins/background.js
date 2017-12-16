const DOM = require('./dom'),
    $ = require('jquery'),
    Storage = require('../lib/storage');
const EVENT_GLOBAL_UPDATE_URL = "global.plugin.background.update",
    EVENT_SANDBOX_UPDATE_URL = "sandbox.background.image.update",
    STORAGE_BACKGROUND_URL = "plugin.background.url";

const FileType = /png|jpe?g|gif/;

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
        event.on(EVENT_SANDBOX_UPDATE_URL, (data) => {
            this.$dom.css("background-image", data.url ? `url(${data.url})` : "");
        });
        if(type === 'console'){
            this.url = Storage.get(STORAGE_BACKGROUND_URL, `http://127.0.0.1:8080/${main.channel}/KV.png`);
            this.$form = $(`<form><input type="url" class="block" id="background-image-url" /><button>设定</button></form>`);
            this.$url = this.$form.find("input");
            this.$form.find("button").click((ev) => {
                ev.preventDefault();
                this.setUrl(this.$url.val());
            });
            event.on(EVENT_GLOBAL_UPDATE_URL, (data) => {
                const url = data.url || "";
                this.$url.val(url);
                Storage.set(STORAGE_BACKGROUND_URL, url);
                event.emit(EVENT_SANDBOX_UPDATE_URL, data);
            });
            // Register processor
            event.on("plugin.file.icon.*", setFileIcon);
            event.on("plugin.file.operation.*", this.setFileOperation.bind(this));
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-image");
                    $icon.find("p").text("背景图片");
                    $icon.click(() => {
                        main.openWindow('background-setup', {
                            theme:       'primary',
                            headerTitle: '背景图片',
                            position:    'center-top 0 30',
                            contentSize: '450 250',
                            content:     this.$form.get(0)
                        });
                    });
                    return $icon;
                });
            });
            this.setUrl(this.url);
        }
    }
    setUrl(url, initial = true){
        this.event.emit(EVENT_GLOBAL_UPDATE_URL, {url, initial});
    }
    setUrlFromDOM(ev){
        this.setUrl($(ev.target).closest(".file-entry").data("url"));
    }
    setFileOperation($cell, extension){
        if(FileType.test(extension)){
            const $button = $('<button>设置背景</button>');
            $button.click(this.setUrlFromDOM.bind(this));
            $cell.append($button);
        }
    }
}

module.exports = Background;
module.exports.GlobalUpdateBackgroundUrl = EVENT_GLOBAL_UPDATE_URL;
module.exports.SandboxUpdateBackgroundUrl = EVENT_SANDBOX_UPDATE_URL;