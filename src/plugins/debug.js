const Plugin = require('./base'),
    $ = require('jquery');
class Debug extends Plugin{
    static name(){
        return 'debug';
    }
    init(type, main, ev){
        if(type === 'console'){
            const $dom = $('<textarea class="full"></textarea>'), createParam = () => {
                return {
                    theme:       'primary',
                    headerTitle: '调试日志',
                    position:    'center-top 0 30',
                    contentSize: '450 250',
                    content:     $dom.get(0)
                };
            };
            this.registerInterests(ev);
            ev.on("debug", function(info){
                $dom.val(info + "\n" + $dom.val());
            });
            this.main = main;
            ev.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-terminal");
                    $icon.find("p").text("调试日志");
                    $icon.click(() => {
                        this.main.openWindow('logger', createParam);
                    });
                    return $icon;
                });
            });
        }else{
            ev.on("**", function(...args){
                console.debug(this.event, ...args);
            });
        }
    }
    registerInterests(ev){
        ev.on('plugin.bridge.entered', () => {
            ev.emit("debug", "Bridge connected and entered.");
        });
        ev.on('console.started', () => {
            ev.emit("debug", "Console starting sequence completed");
        });
        ev.on("promise.**", function(){
            ev.emit("debug", this.event);
        });
        ev.on("enter", (params) => {
            ev.emit("debug", `Endpoint ${params.src} entered ${params.channel} as ${params.role}`);
        });
    }
}
module.exports = Debug;