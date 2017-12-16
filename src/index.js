if(!window) throw new Error('I am not in a browser!');

const Monitor = require('./lib/monitor'),
    Console = require('./lib/console'),
    Sandbox = require('./lib/sandbox'),
    Bridge = require('./plugins/bridge'),
    Background = require('./plugins/background'),
    VideoPlayer = require('./plugins/video-player'),
    FB2K = require('./plugins/fb2k'),
    $ = require('jquery');

$(function(){
    const $body = $("body"),
        channel = $body.data("channel") || 'default',
        plugins = [
            new Bridge(),
            new Background(),
            new VideoPlayer(),
            new FB2K(),
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
        default:
            throw new Error('No role defined in body data.');
    }
    window.$ = $;
    window.webPA = main;
    window.webPA.role = role;
    main.start();
    $(window).on("unload", main.stop.bind(main));
});
