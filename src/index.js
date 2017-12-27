import 'bootstrap';
if(!window) throw new Error('I am not in a browser!');

const Monitor = require('./lib/monitor'),
    Console = require('./lib/console'),
    Light = require('./lib/light'),
    Sandbox = require('./lib/sandbox'),
    Bridge = require('./plugins/bridge'),
    Background = require('./plugins/background'),
    VideoPlayer = require('./plugins/video-player'),
    AudioPlayer = require('./plugins/audio-player'),
    FB2K = require('./plugins/fb2k'),
    Camera = require('./plugins/carema'),
    MediaManager = require('./plugins/file-manager'),
    ProgramManager = require('./plugins/program-manager'),
    Judgement = require('./plugins/guest-judgement'),
    Roller = require('./plugins/roll'),
    Locker = require('./plugins/locker'),
    LightBoard = require('./plugins/light-board'),
    Images = require('./plugins/image'),
    $ = require('jquery');

if(typeof HTMLMediaElement.prototype.playing === 'undefined') Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get: function(){
        return this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2;
    }
});

$(function(){
    const $body = $("body"),
        channel = $body.data("channel") || 'default',
        plugins = [
            new Bridge(),
            new Locker(),
            new Background(),
            new Images(),
            new VideoPlayer(),
            new AudioPlayer(),
            new FB2K(),
            new Camera(),
            new MediaManager(),
            new ProgramManager(),
            new Judgement(),
            new Roller(),
            new LightBoard(),
        ], debug = !!$body.data("debug");
    let role = $body.data('role'), main;
    // plugin dependencies are explicit via constructor
    if(debug){
        const Debug = require('./plugins/debug');
        plugins.push(new Debug());
    }
    if(role === 'console'){
        const Preview = require('./plugins/preview');
        plugins.push(new Preview());
    }
    switch(role){
        case 'console':
            main = new Console(channel, $('.desktop-container'), plugins);
            break;
        case 'monitor':
            const sandbox = new Sandbox($('.sandbox'), {preview: false});
            main = new Monitor(channel, sandbox, plugins);
            break;
        case 'light':
            main = new Light(channel, plugins);
            break;
        default:
            throw new Error('No role defined in body data.');
    }
    window.webPA = main;
    window.webPA.role = role;
    main.start();
    $(window).on("unload", main.stop.bind(main));
});
