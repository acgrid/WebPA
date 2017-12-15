const Plugin = require('./base');

class BridgeDebug extends Plugin{
    constructor(bridge, debug){
        super();
        this.bridge = bridge;
        this.debug = debug;
    }
    static name(){
        return 'bridge-debug';
    }
    init(role, main, ev){
        ev.on("plugin.bridge.socket", function(socket){
            socket.on('connect', function(){

            });
            socket.on('disconnect', function(){

            });
            if(role === 'console'){
                socket.on('ping', function(){

                });
                socket.on('pong', function(){

                });
            }
        }.bind(this));
    }
}
module.exports = BridgeDebug;