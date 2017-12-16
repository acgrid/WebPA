const Plugin = require('./base'),
    Sandbox = require('../lib/sandbox'),
    Storage = require('../lib/storage'),
    $ = require('jquery');

function getSetMuted(bool){
    if(typeof bool === "undefined") return !!Storage.get("preview.muted");
    Storage.set("preview.muted", bool);
}
class Preview extends Plugin{
    static name(){
        return 'preview';
    }
    init(type, main, event){
        if(type === 'console'){
            this.sandbox = new Sandbox($(`<div class="sandbox"></div>`), {preview: true});
            event.on("console.started", () => {
                main.createWindow({
                    id:          'preview',
                    theme:       'warning',
                    headerTitle: '预览窗口',
                    position:    {
                        my:      "right-bottom",
                        at:      "right-bottom",
                        offsetX: 0,
                        offsetY: 0
                    },
                    headerControls:{
                        close: "disable"
                    },
                    contentSize: {width:  '960px', height: '540px'},
                    content:     this.sandbox.container.get(0)
                });
            });
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-tv");
                    $icon.find("p").text("预览设置");
                    $icon.click(() => {
                        main.openWindow('preview-setup', this.setupWindow.bind(this, event));
                    });
                    return $icon;
                });
            });
            event.on("console.starting", () => {
                event.emit("sandbox.create", this.sandbox);
                const muted = getSetMuted();
                event.emit('global.plugin.video.configure', {muted});
                event.emit('global.plugin.audio.configure', {muted});
            });
        }
    }
    setupWindow(event){
        const $form = $('<form id="preview-setup"></form>');
        $form.append($(`<input type="checkbox" id="preview-setup-mute" /><label for="preview-setup-mute">本地静音</label>`).attr("checked", getSetMuted()).on("change", function(){
            getSetMuted(this.checked);
            event.emit('global.plugin.video.configure', {muted: this.checked});
            event.emit('global.plugin.audio.configure', {muted: this.checked});
        }));
        return {
            theme:       'primary',
            headerTitle: '预览设置',
            position:    'center-top 0 30',
            contentSize: '450 250',
            content:     $form.get(0)
        };
    }
}
module.exports = Preview;