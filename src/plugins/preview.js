const Plugin = require('./base'),
    Sandbox = require('../lib/sandbox');
    Storage = require('../lib/storage');
    $ = require('jquery');
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
            });
        }
    }
    setupWindow(event){
        const $form = $('<form id="preview-setup"></form>');
        $form.append($(`<input type="checkbox" id="preview-setup-mute" /><label for="preview-setup-mute">视频静音</label>`).attr("checked", !!Storage.get("preview.muted")).on("change", function(){
            Storage.set("preview.muted", this.checked);
            event.emit('sandbox.video.configure', {muted: this.checked})
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