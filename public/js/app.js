webpackJsonp([0],[
/* 0 */,
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

const EventEmitter2 = __webpack_require__(9).EventEmitter2;
module.exports = new EventEmitter2({
    wildcard: true,
    newListener: false,
    maxListeners: 30
});


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

const pluginList = new WeakMap(),
    privateData = new WeakMap(),
    ev = __webpack_require__(1);

class Main
{
    constructor(name, plugins, data, init = null){
        ev.emit(`${this.name}.constructing`, arguments, this);
        if(!Array.isArray(plugins)) plugins = [];
        this.name = name;
        pluginList.set(this, plugins);
        privateData.set(this, data);
        this.plugins.forEach((plugin) => {
            const name = plugin.name();
            ev.emit(`plugin.${name}.initializing`, plugin, this);
            plugin.init(name, this, ev);
            ev.emit(`plugin.${name}.initialized`);
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

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

const $ = __webpack_require__(0),
    layers = new WeakMap(),
    layerStacks = new WeakMap(),
    options = new WeakMap(),
    containers = new WeakMap();
class Sandbox{
    constructor($container, options = {}){
        if(!($container instanceof $)) $container = $($container);
        containers.set(this, $container);
        options.set(this, options);
        layers.set(this, {});
        layerStacks.set(this, []);
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
            let index = this.stack.length;
            layer = factory(index);
            if(!(layer instanceof $)) layer = $(`<div class="layer" id="${layerName}"></div>`).css('z-index', index);
            this.layers[layerName] = layer;
            this.stack.push(layer);
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

/***/ }),
/* 4 */,
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(6);
__webpack_require__(7);
module.exports = __webpack_require__(14);


/***/ }),
/* 6 */,
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

if(!window) throw new Error('I am not in a browser!');

const Monitor = __webpack_require__(8),
    Console = __webpack_require__(11),
    Sandbox = __webpack_require__(3),
    $ = __webpack_require__(0);

$(function(){
    const $body = $("body"),
        channel = $body.data("channel") || 'default',
        plugins = [
            // add & configure features here
        ];
    let role = $body.data('role'), main;
    // plugin dependencies are explicit via constructor
    if($body.data("debug")){

        // push debug plugin here
    }
    if(role === 'console'){
        const Preview = __webpack_require__(12);
        plugins.push(new Preview());
    }
    switch(role){
        case 'console':
            main = new Console(channel, $('.desktop-container'), plugins);
            break;
        case 'monitor':
            const sandbox = new Sandbox($('.sandbox-container'), {preview: false});
            main = new Monitor(channel, sandbox, plugins);
            break;
        default:
            throw new Error('No role defined in body data.');
    }
    window.webPA = main;
    window.webPA.role = role;
    main.start();
    $(window).unload(main.stop.bind(main));
});


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

const $ = __webpack_require__(0),
    Main = __webpack_require__(2),
    ev = __webpack_require__(1);

$(function(){
    const v = document.getElementById('playback');
    const canvas = document.getElementById('overlay');
    const context = canvas.getContext('2d');

    canvas.width = v.clientWidth;
    canvas.height = v.clientHeight;
    context.strokeStyle = 'white';
    context.strokeRect(0, 0, v.clientWidth, v.clientHeight);
    context.strokeText('TEST3', 10, 10, 100);
});

class Monitor extends Main{
    constructor(channel, sandbox, plugins = []){
        super('monitor', plugins, {channel, sandbox}, (ev) => {
            // init here
        });
    }
    get channel(){
        return this.data.channel;
    }
    get sandbox(){
        return this.data.sandbox;
    }
    start(){
        super.start((ev) => {
            //
        });
    }
    stop(){
        super.stop((ev) => {
            //
        });
    }
}
module.exports = Monitor;

/***/ }),
/* 9 */,
/* 10 */,
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

const $ = __webpack_require__(0),
    Main = __webpack_require__(2),
    ev = __webpack_require__(1);

class Console extends Main{
    constructor(channel, desktop, plugins){
        super('console', plugins, {channel, desktop}, (ev) => {
            ev.trigger("console.build");
        });
    }
    get channel(){
        return this.data.channel;
    }
    get desktop(){
        return this.data.desktop;
    }
    start(){
        super.start((ev) => {

        });
    }
    stop(){
        super.stop((ev) => {

        });
    }
    createIcon(params){

    }
    createWindow(params){

    }
}
module.exports = Console;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

const Plugin = __webpack_require__(13),
    Sandbox = __webpack_require__(3);
    $ = __webpack_require__(0);
class Preview extends Plugin{
    static name(){
        return 'preview';
    }
    init(type, main, event){
        if(type === 'console'){
            this.main = main;
            this.sandbox = new Sandbox($(`<div class="sandbox-container"></div>`), {preview: true});
            // register stuff
            event.on("console.build", () => {
                main.createIcon({
                    title: "预览窗口",
                    icon: "fa-zoom-in",
                    window: "preview"
                });
            });
        }
    }
}
module.exports = Preview;

/***/ }),
/* 13 */
/***/ (function(module, exports) {

class Plugin
{
    static name(){
        return 'plugin';
    }
    init(role, main, ev){
    }
}
module.exports = Plugin;

/***/ })
],[5]);