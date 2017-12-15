const Plugin = require('./base');
class Debug extends Plugin{
    static name(){
        return 'debug';
    }
    init(type, main, ev){
        ev.on('plugin.bridge.entered', () => {
            ev.emit("debug", "Bridge connected and entered.");
        });
        if(type === 'console'){
            const $dom = $('<textarea class="full"></textarea>'), onClick = () => {
                if(!this.active){
                    this.main.createWindow({
                        theme:       'primary',
                        headerTitle: '调试信息',
                        position:    'center-top 0 30',
                        contentSize: '450 250',
                        content:     $dom.get(0),
                        callback: () => {
                            this.active = true;
                        },
                        onclosed: () => {
                            this.active = false;
                        }
                    });
                }
            };
            ev.on("debug", function(...args){
                $dom.val(JSON.stringify(args) + "\n" + $dom.val());
            });
            this.main = main;
            this.active = false;
            this.main.createIcon(($icon) => {
                $icon.find("i").addClass("fa-terminal");
                $icon.find("p").text("调试信息");
                $icon.click(onClick);
                return $icon;
            });
        }else{
            ev.on("debug", function(...args){
                console.debug(...args);
            });
        }
    }
}
module.exports = Debug;