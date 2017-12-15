const Plugin = require('./base'),
    Sandbox = require('../lib/sandbox');
    $ = require('jquery');
class Preview extends Plugin{
    static name(){
        return 'preview';
    }
    init(type, main, event){
        if(type === 'console'){
            this.active = false;
            this.main = main;
            this.sandbox = new Sandbox($(`<div class="sandbox"></div>`), {preview: true});
            const executor = () => {
                if(!this.active){
                    this.main.createWindow({
                        theme:       'warning',
                        headerTitle: '预览窗口',
                        position:    {
                            my:      "right-bottom",
                            at:      "right-bottom",
                            offsetX: 0,
                            offsetY: 50
                        },
                        contentSize: {width:  '960px', height: '540px'},
                        content:     this.sandbox.container.get(0),
                        callback: () => {
                            this.active = true;
                        },
                        onclosed: () => {
                            this.active = false;
                        }
                    });
                }
            };
            // register stuff
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-tv");
                    $icon.find("p").text("预览窗口");
                    $icon.click(executor);
                    return $icon;
                });
            });
            event.on("console.starting", () => {
                event.emit("sandbox.create", this.sandbox);
            });
        }
    }
}
module.exports = Preview;