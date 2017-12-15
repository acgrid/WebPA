const Plugin = require('./base');
class MultiMonitor extends Plugin{
    static name(){
        return 'multi-monitor';
    }
    init(role, main, ev){
        event.on("console.build", () => {
            main.createIcon({
                title: "预览窗口",
                icon: "fa-zoom-in",
                window: "preview"
            });
        });
    }
}
module.exports = MultiMonitor;