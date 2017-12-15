const pluginList = new WeakMap(),
    privateData = new WeakMap(),
    ev = require('../lib/event');

class Main
{
    constructor(name, plugins, data, init = null){
        ev.emit(`${this.name}.constructing`, arguments, this);
        if(!Array.isArray(plugins)) plugins = [];
        this.name = name;
        pluginList.set(this, plugins);
        privateData.set(this, data);
        this.plugins.forEach((plugin) => {
            const pluginName = plugin.constructor.name();
            ev.emit(`plugin.${pluginName}.initializing`, plugin, this);
            plugin.init(name, this, ev);
            ev.emit(`plugin.${pluginName}.initialized`);
        });
        if(init) init(ev);
        ev.emit(`${this.name}.constructed`, this);
    }
    get plugins(){
        return pluginList.get(this);
    }
    get data(){
        return privateData.get(this);
    }
    static get event(){
        return ev;
    }
    start(func = null){
        ev.emit(`${this.name}.starting`);
        if(func) func(ev);
        ev.emit(`${this.name}.started`);
    }
    stop(func = null){
        ev.emit(`${this.name}.stopping`);
        if(func) func(ev);
        ev.emit(`${this.name}.stopped`);
    }
    dump(){
        console.log(this.plugins, this.data);
    }
}
module.exports = Main;