const Plugin = require('./base');

module.exports = class DOM extends Plugin{
    constructor(layer, callback){
        super();
        this.layer = layer;
        this.callback = callback;
    }
    static name(){
        return 'dom';
    }
    init(type, main, event){
        event.on("sandbox.create", (sandbox) => {
            sandbox.create(this.layer, this.callback);
        });
    }
};