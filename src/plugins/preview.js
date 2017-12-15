const Plugin = require('./base'),
    Sandbox = require('../lib/sandbox');
    $ = require('jquery');
class Preview extends Plugin{
    static name(){
        return 'preview';
    }
    init(type, main, event){
        if(type === 'console'){
            this.main = main;
            this.sandbox = new Sandbox($(`<div class="sandbox"></div>`), {preview: true});
            // register stuff
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-tv");
                    $icon.find("p").text("预览窗口");
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