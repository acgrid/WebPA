const io = require('socket.io-client'),
    Plugin = require('./base');
class Bridge extends Plugin{
    constructor(options = {}){
        super();
        options.autoConnect = false;
        this.socket = io(location.protocol + '//' + location.host, options);
    }
    static name(){
        return 'bridge';
    }
    init(role, main, ev){
        const socket = this.socket;
        let stopping = false;
        const receive = (transport) => {
            ev.emit(transport.name, transport.params);
        }, emit = (name, params) => {
            socket.emit(name, params);
        }, forward = function(params = {}){
            const name = this.event, type = name.substr(0, name.indexOf('.'));
            ev.emit("debug", `Test forwarding event ${name} with ${JSON.stringify(params)}`);
            if(type === 'sandbox'){
                if(params.initial){
                    delete params.initial;
                }else{
                    return;
                }
            }
            ev.emit("debug", `forward event ${name} as type ${type}, params ${JSON.stringify(params)}`);
            emit(type, {name, params});
        }, errorHandler = (error) => {
            ev.emit('plugin.bridge.socket.error', error);
        }, timeoutHandler = (timeout) => {
            ev.emit('plugin.bridge.socket.timeout', timeout);
        };
        ev.emit('plugin.bridge.socket.init', this); // attach bridge
        socket.on("connect_timeout", timeoutHandler);
        socket.on("connect_error", errorHandler);
        socket.on("error", errorHandler);
        socket.on("connect", () => {
            ev.emit('plugin.bridge.socket.opened', this);
            socket.emit('enter', {role, channel: main.channel}, (error) => {
                if(error){
                    ev.em('plugin.bridge.socket.error', error);
                }else{
                    ev.emit('plugin.bridge.entered', this);
                }
            });
        });
        socket.on("disconnect", (reason) => {
            if(stopping){
                ev.emit('plugin.bridge.exited', this, reason);
            }
        });
        if(role === 'console'){
            socket.on("env", receive);
            socket.on("monitor", receive);
            socket.on("common", receive);
            socket.on("global", receive);
            ev.on("sandbox.**", forward);
            ev.on("global.**", forward);
        }else if(role === 'monitor'){
            ev.on("promise.**", forward);
            socket.on("sandbox", receive);
        }
        ev.on("*.starting", function(){
            socket.open();
            ev.emit('plugin.bridge.socket.opening', this);
        });
        ev.on("*.stopping", function(){
            ev.emit('plugin.bridge.exiting', this);
            socket.emit('exit', () => {
                socket.close();
                ev.emit('plugin.bridge.exited', this);
            });
        });
    }
}
module.exports = Bridge;
