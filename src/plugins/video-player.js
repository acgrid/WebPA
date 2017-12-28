const DOMPlugin = require('./dom'),
    Time = require('../lib/time'),
    $ = require('jquery');

const SEEKING_OFFSET = 5;

const EVENT_SANDBOX_VIDEO_CONFIGURE = 'sandbox.video.configure',
    EVENT_SANDBOX_VIDEO_OPEN = 'sandbox.video.open',
    EVENT_SANDBOX_VIDEO_PLAY = 'sandbox.video.play',
    EVENT_SANDBOX_VIDEO_PAUSE = 'sandbox.video.pause',
    EVENT_SANDBOX_VIDEO_STOP = 'sandbox.video.stop',
    EVENT_SANDBOX_VIDEO_SEEK = 'sandbox.video.seek',
    EVENT_SANDBOX_VIDEO_TOGGLE = 'sandbox.video.toggle',

    // LOCAL ONLY
    EVENT_GLOBAL_VIDEO_LOCAL_CONFIGURE = 'global.plugin.video.configure',
    // FORWARD
    EVENT_GLOBAL_VIDEO_OPEN = 'global.plugin.video.open',
    EVENT_GLOBAL_VIDEO_PLAY = 'global.plugin.video.play',
    EVENT_GLOBAL_VIDEO_PAUSE = 'global.plugin.video.pause',
    EVENT_GLOBAL_VIDEO_STOP = 'global.plugin.video.stop',
    EVENT_GLOBAL_VIDEO_SEEK = 'global.plugin.video.seek',
    EVENT_GLOBAL_VIDEO_LOOP = 'global.plugin.video.loop',

    EVENT_MONITOR_VIDEO_CAN_PLAY = 'promise.plugin.video.canplay',
    EVENT_MONITOR_VIDEO_PLAYING = 'promise.plugin.video.playing',
    EVENT_MONITOR_VIDEO_PAUSED = 'promise.plugin.video.paused',
    EVENT_MONITOR_VIDEO_RESUMED = 'promise.plugin.video.resumed',
    EVENT_MONITOR_VIDEO_STOPPED = 'promise.plugin.video.stopped',
    EVENT_MONITOR_VIDEO_SEEKING = 'promise.plugin.video.seeking',
    EVENT_MONITOR_VIDEO_SEEKED = 'promise.plugin.video.seeked'
;

function setFileIcon($icon){
    $icon.removeClass("fa-file").addClass("fa-file-video");
}

class VideoPlayer extends DOMPlugin{
    static name(){
        return 'video';
    }
    constructor(){
        super('video');
        this.$video = $(`<video class="full hidden"></video>`);
        this.video = this.$video.get(0);
    }
    createDOM(){
        return this.$video;
    }
    setVideoProps(props){
        this.$video.prop(props);
    }
    myInit(type, main, event){
        this.event = event;
        // SANDBOX
        event.on(EVENT_SANDBOX_VIDEO_CONFIGURE, (data) => {
            let props = {};
            $.extend(props, data);
            if(props.initial) delete props.initial;
            this.setVideoProps(props);
        });
        event.on(EVENT_SANDBOX_VIDEO_OPEN, (data) => {
            this.$video.addClass("hidden");
            if(data.url) this.$video.prop("src", data.url);
        });
        event.on(EVENT_SANDBOX_VIDEO_PLAY, () => {
            this.$video.removeClass("hidden");
            this.video.play();
        });
        event.on(EVENT_SANDBOX_VIDEO_PAUSE, () => {
            this.video.pause();
        });
        event.on(EVENT_SANDBOX_VIDEO_STOP, () => {
            this.video.loop = false;
            this.$video.addClass("hidden");
            this.video.pause();
            this.video.currentTime = 0;
        });
        event.on(EVENT_SANDBOX_VIDEO_SEEK, (data) => {
            if(data.time) this.video.currentTime = data.time;
        });
        event.on(EVENT_SANDBOX_VIDEO_TOGGLE, (data) => {
            console.log(data);
            this.$video.toggleClass('hidden', !data.toggle);
        });
        // MONITOR
        event.on(EVENT_MONITOR_VIDEO_STOPPED, () => {
            if(!this.video.loop) this.$video.addClass("hidden");
        });
        this.$video.on("canplay", (ev) => {
            event.emit(EVENT_MONITOR_VIDEO_CAN_PLAY, ev);
        });
        this.$video.on("playing", (ev) => {
            event.emit(EVENT_MONITOR_VIDEO_PLAYING, ev);
        });
        this.$video.on("pause", (ev) => {
            event.emit(EVENT_MONITOR_VIDEO_PAUSED, ev);
        });
        this.$video.on("play", (ev) => {
            event.emit(EVENT_MONITOR_VIDEO_RESUMED, ev);
        });
        this.$video.on("ended", (ev) => {
            event.emit(EVENT_MONITOR_VIDEO_STOPPED, ev);
        });
        this.$video.on("seeking", (ev) => {
            event.emit(EVENT_MONITOR_VIDEO_SEEKING, ev);
        });
        this.$video.on("seeked", (ev) => {
            event.emit(EVENT_MONITOR_VIDEO_SEEKED, ev);
        });
        if(type === 'console'){
            event.on(EVENT_GLOBAL_VIDEO_LOCAL_CONFIGURE, this.setVideoProps.bind(this));
            this.$player = $(`<div class="video-player"><input type="url" class="block" id="video-url" placeholder="视频URL" />
<p class="text-center">
<button id="video-open"><i class="fa fa-2x fa-fw fa-folder-open"></i></button>
<button id="video-play" class="video-after-open" disabled><i class="fa fa-2x fa-fw fa-play"></i></button>
<button id="video-pause" class="video-after-open" disabled><i class="fa fa-2x fa-fw fa-pause"></i></button>
<button id="video-stop" class="video-after-open" disabled><i class="fa fa-2x fa-fw fa-stop"></i></button>
<button id="video-backward" class="video-after-open" disabled><i class="fa fa-2x fa-fw fa-backward"></i></button>
<button id="video-forward" class="video-after-open" disabled><i class="fa fa-2x fa-fw fa-forward"></i></button>
<button id="video-show"><i class="fa fa-2x fa-fw fa-eye"></i></button>
<button id="video-hide"><i class="fa fa-2x fa-fw fa-eye-slash"></i></button>
</p>
<p class="text-center">
<progress></progress>&nbsp;<span class="current">-</span>/<span class="total"></span>
</p>
<p class="text-center">
<input type="time" value="00:00" /> <button id="video-seek" class="video-after-open" disabled><i class="fa fa-fw fa-angle-double-right"></i></button>
</p>
<p class="text-center">
<input type="checkbox" id="video-loop"><label for="video-loop">循环</label>
</p>
</div>`);
            this.$controls = this.$player.find(".video-after-open");
            this.$url = this.$player.find("input[type=url]");
            this.$time = this.$player.find("input[type=time]");
            this.$current = this.$player.find(".current");
            this.$total = this.$player.find(".total");
            this.$progress = this.$player.find("progress");
            this.$loop = this.$player.find("#video-loop");
            this.$show = this.$player.find("#video-show");
            this.$hide = this.$player.find("#video-hide");
            let updateHandle;
            // OPEN
            this.$player.find("#video-open").click(() => {
                this.open(this.$url.val());
            });
            event.on(EVENT_GLOBAL_VIDEO_OPEN, (data) => {
                const url = data.url || "";
                this.$url.val(url);
                this.$controls.prop("disabled", true);
                event.emit(EVENT_SANDBOX_VIDEO_OPEN, data);
                this.play();
            });
            event.on(EVENT_MONITOR_VIDEO_CAN_PLAY, () => {
                this.$controls.prop("disabled", false);
            });
            // PLAY
            this.$player.find("#video-play").click(() => {
                this.play();
            });
            event.on(EVENT_GLOBAL_VIDEO_PLAY, (data) => {
                event.emit(EVENT_SANDBOX_VIDEO_PLAY, data);
            });
            // PAUSE
            this.$player.find("#video-pause").click(() => {
                this.pause();
            });
            event.on(EVENT_GLOBAL_VIDEO_PAUSE, (data) => {
                event.emit(EVENT_SANDBOX_VIDEO_PAUSE, data);
            });
            // STOP
            this.$player.find("#video-stop").click(() => {
                this.stop();
            });
            event.on(EVENT_GLOBAL_VIDEO_STOP, (data) => {
                event.emit(EVENT_SANDBOX_VIDEO_STOP, data);
            });
            // SEEK
            this.$player.find("#video-seek").click(() => {
                const time = Time.msToSeconds(this.$time.val());
                event.emit("debug", `Seeking video ${time}`);
                this.seek(time);
            });
            this.$player.find("#video-backward").click(() => {
                this.seek(this.video.currentTime - SEEKING_OFFSET);
            });
            this.$player.find("#video-forward").click(() => {
                this.seek(this.video.currentTime + SEEKING_OFFSET);
            });
            event.on(EVENT_GLOBAL_VIDEO_SEEK, (data) => {
                event.emit(EVENT_SANDBOX_VIDEO_SEEK, data);
            });
            // LOOP
            this.$loop.change(() => {
                this.loop(this.$loop.prop("checked"));
            });
            event.on(EVENT_GLOBAL_VIDEO_LOOP, (data) => {
                if(!data.initial) this.$loop.prop("checked", data.loop);
                event.emit(EVENT_SANDBOX_VIDEO_CONFIGURE, data);
            });
            // TOGGLE (NO LOCAL CHANGES NOW)
            this.$show.click(() => {
                event.emit(EVENT_SANDBOX_VIDEO_TOGGLE, {toggle: true, initial: true});
            });
            this.$hide.click(() => {
                event.emit(EVENT_SANDBOX_VIDEO_TOGGLE, {toggle: false, initial: true});
            });
            // REGISTER
            ['mp4', 'mpg', 'ogg', 'mkv'].forEach((extension) => {
                event.on(`plugin.file.icon.${extension}`, setFileIcon);
                event.on(`plugin.file.operation.${extension}`, this.setFileOperation.bind(this));
            });
            event.on("plugin.program.file.select", (files, selected) => {
                for(let file of files){
                    if(/mp4|mpg|ogg|mkv/i.test(file.extension)){
                        selected.video = file.url;
                        return;
                    }
                }
            });
            // UI
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-video");
                    $icon.find("p").text("视频播放");
                    $icon.click(() => {
                        main.openWindow('video-player', {
                            theme:       'info',
                            headerTitle: '视频播放',
                            position:    'center-top 0 30',
                            contentSize: '640 300',
                            content:     this.$player.get(0)
                        });
                    });
                    return $icon;
                });
            });
            event.on("console.started", () => {
                updateHandle = setInterval(this.update.bind(this), 1000);
            });
            event.on("console.stopping", () => {
                clearInterval(updateHandle);
            });
        }
    }
    open(url, initial = true){
        this.event.emit(EVENT_GLOBAL_VIDEO_OPEN, {url, initial});
    }
    play(initial = true){
        this.event.emit(EVENT_GLOBAL_VIDEO_PLAY, {initial});
    }
    pause(initial = true){
        this.event.emit(EVENT_GLOBAL_VIDEO_PAUSE, {initial});
    }
    stop(initial = true){
        this.event.emit(EVENT_GLOBAL_VIDEO_STOP, {initial});
    }
    seek(time, initial = true){
        this.event.emit(EVENT_GLOBAL_VIDEO_SEEK, {time, initial});
    }
    loop(loop, initial = true){
        this.event.emit(EVENT_GLOBAL_VIDEO_LOOP, {loop, initial});
    }
    setUrlFromDOM(ev){
        this.event.emit('global.plugin.audio.stop', {initial: true});
        this.open($(ev.target).closest(".file-entry").data("url"));
    }
    setFileOperation($cell){
        const $button = $('<button class="btn btn-primary btn-sm"><i class="fa fa-fw fa-play"></i></button>');
        $button.click(this.setUrlFromDOM.bind(this));
        $cell.append($button);
    }
    update(){
        const total = this.video.duration, current = this.video.currentTime;
        if(total){
            this.$current.text(Time.secondsToMS(current));
            this.$total.text(Time.secondsToMS(total));
            this.$progress.prop({max: total, value: current});
        }else{
            this.$current.text('-');
            this.$total.text('-');
            this.$progress.removeProp('max');
        }
        this.$loop.prop("checked", this.video.loop);
        if(this.video.playing) this.event.emit("plugin.media.playing", "video", current, total);
    }
}

module.exports = VideoPlayer;