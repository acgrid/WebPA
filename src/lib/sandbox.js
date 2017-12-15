const $ = require('jquery'),
    layers = new WeakMap(),
    layerStacks = new WeakMap(),
    options = new WeakMap(),
    containers = new WeakMap();

const $layer = $(`<div class="layer"></div>`);

class Sandbox{
    constructor($container, option = {}){
        if(!($container instanceof $)) $container = $($container);
        containers.set(this, $container);
        options.set(this, option);
        layers.set(this, {});
        layerStacks.set(this, []);
    }
    get container(){
        return containers.get(this);
    }
    get layers(){
        return layers.get(this);
    }
    get options(){
        return options.get(this);
    }
    get stack(){
        return layerStacks.get(this);
    }
    get(layerName){
        return this.layers[layerName] ? this.layers[layerName] : null;
    }
    create(layerName, factory){
        if(typeof factory !== 'function') throw new Error('Layer factory shall be a function');
        let layer = this.get(layerName);
        if(layer === null){
            let index = this.stack.length, $container = $layer.clone().attr("id", layerName).css('z-index', index);
            layer = factory(index);
            if(layer instanceof $) $container.append(layer);
            this.layers[layerName] = $container;
            this.stack.push($container);
            this.container.append($container);
        }else{
            factory(layer);
        }
        return layer;
    }
    top(layerName){
        return this.get(layerName).css("z-index", 99999);
    }
    bottom(layerName){
        return this.get(layerName).css("z-index", 0);
    }
    restore(){
        const stack = this.stack;
        for(let layer of this.layers){
            layer.css("z-index", stack.indexOf(layer));
        }
    }
    show(layerName){
        return this.get(layerName).removeClass("hidden");
    }
    hide(layerName){
        return this.get(layerName).addClass("hidden");
    }
    only(layerName){
        for(let layer in this.layers){
            this[layer === layerName ? 'show' : 'hide'](layerName);
        }
    }
    all(){
        for(let layer in this.layers){
            this.show(layer);
        }
    }
}
module.exports = Sandbox;