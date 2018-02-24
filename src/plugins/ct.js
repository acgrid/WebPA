const Plugin = require('./base'),
    $ = require('jquery');

const KEY = 'ybN6rAE8bkKiGPEUCp36EoFDwbWNTtSa';

function update(index){
    $.get("https://www.comitime.com/wechat/app/danmaku/client", {key: KEY, action: "live", index});
}

class LightBoard extends Plugin{
    static name(){
        return 'ct';
    }
    init(role, main, event){
        this.main = main;
        this.event = event;
        if(role === 'console'){
            this.event.on("plugin.program.execute", (program) => {
                update(program.index);
            });
            this.event.on("plugin.program.finish", () => {
                update(-1);
            });
        }
    }
}

module.exports = LightBoard;