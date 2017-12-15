const Plugin = require('./base'),
    Sandbox = require('../lib/sandbox');
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
            event.on("console.starting", () => {
                event.emit("sandbox.create", this.sandbox);
            });
        }
    }
}
module.exports = Preview;