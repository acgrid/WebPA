const Plugin = require('./base');

module.exports = class DOM extends Plugin{
    constructor(layer){
        super();
        this.layer = layer;
    }
    static name(){
        return 'dom';
    }
    init(type, main, event){
        event.on("sandbox.create", (sandbox) => {
            sandbox.create(this.layer, this.createDOM.bind(this, [type, main, event]));
        });
        this.myInit(type, main, event);
    }
    createDOM(type, main, event){
        console.warn("Base version of DOM is invoked!", this.layer, event);
    }
    myInit(type, main, event){
        console.warn("Base version of DOM is invoked!", this.layer, event);
    }
};