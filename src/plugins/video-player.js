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

    EVENT_GLOBAL_VIDEO_LOCAL_CONFIGURE = 'global.plugin.video.configure',
    EVENT_GLOBAL_VIDEO_OPEN = 'global.plugin.video.open',
    EVENT_GLOBAL_VIDEO_PLAY = 'global.plugin.video.play',
    EVENT_GLOBAL_VIDEO_PAUSE = 'global.plugin.video.pause',
    EVENT_GLOBAL_VIDEO_STOP = 'global.plugin.video.stop',
    EVENT_GLOBAL_VIDEO_SEEK = 'global.plugin.video.seek',

    EVENT_MONITOR_VIDEO_CAN_PLAY = 'promise.plugin.video.canplay',
    EVENT_MONITOR_VIDEO_PLAYING = 'promise.plugin.video.playing',
    EVENT_MONITOR_VIDEO_PAUSED = 'promise.plugin.video.paused',
    EVENT_MONITOR_VIDEO_RESUMED = 'promise.plugin.video.resumed',
    EVENT_MONITOR_VIDEO_STOPPED = 'promise.plugin.video.stopped',
    EVENT_MONITOR_VIDEO_SEEKING = 'promise.plugin.video.seeking',
    EVENT_MONITOR_VIDEO_SEEKED = 'promise.plugin.video.seeked'
;

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
        this.$video.on("ended", () => {
            this.$video.addClass("hidden");
        });
        // SANDBOX
        event.on(EVENT_SANDBOX_VIDEO_CONFIGURE, this.setVideoProps.bind(this));
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
            this.$video.addClass("hidden");
            this.video.pause();
        });
        event.on(EVENT_SANDBOX_VIDEO_SEEK, (data) => {
            if(data.time) this.video.currentTime = data.time;
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
</p>
<p class="text-center">
<input type="time" value="00:00" /> <button id="video-seek" class="video-after-open" disabled><i class="fa fa-fw fa-angle-double-right"></i></button>
</p>
</div>`);
            this.$controls = this.$player.find(".video-after-open");
            this.$url = this.$player.find("input[type=url]");
            this.$time = this.$player.find("input[type=time]");
            // OPEN
            this.$player.find("#video-open").click(() => {
                this.open(this.$url.val());
            });
            event.on(EVENT_GLOBAL_VIDEO_OPEN, (data) => {
                const url = data.url || "";
                this.$url.val(url);
                this.$controls.prop("disabled", true);
                event.emit(EVENT_SANDBOX_VIDEO_OPEN, data);
            });
            this.$video.on("canplay", (ev) => {
                this.$controls.prop("disabled", false);
                event.emit(EVENT_MONITOR_VIDEO_CAN_PLAY, ev);
            });
            // PLAY
            this.$player.find("#video-play").click(() => {
                this.play();
            });
            event.on(EVENT_GLOBAL_VIDEO_PLAY, (data) => {
                event.emit(EVENT_SANDBOX_VIDEO_PLAY, data);
            });
            this.$video.on("playing", (ev) => {
                event.emit(EVENT_MONITOR_VIDEO_PLAYING, ev);
            });
            // PAUSE
            this.$player.find("#video-pause").click(() => {
                this.pause();
            });
            event.on(EVENT_GLOBAL_VIDEO_PAUSE, (data) => {
                event.emit(EVENT_SANDBOX_VIDEO_PAUSE, data);
            });
            this.$video.on("pause", (ev) => {
                event.emit(EVENT_MONITOR_VIDEO_PAUSED, ev);
            });
            this.$video.on("play", (ev) => {
                event.emit(EVENT_MONITOR_VIDEO_RESUMED, ev);
            });
            // STOP
            this.$player.find("#video-stop").click(() => {
                this.stop();
            });
            event.on(EVENT_GLOBAL_VIDEO_STOP, (data) => {
                event.emit(EVENT_SANDBOX_VIDEO_STOP, data);
            });
            this.$video.on("end", (ev) => {
                event.emit(EVENT_MONITOR_VIDEO_STOPPED, ev);
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
            this.$video.on("seeking", (ev) => {
                event.emit(EVENT_MONITOR_VIDEO_SEEKING, ev);
            });
            this.$video.on("seeked", (ev) => {
                event.emit(EVENT_MONITOR_VIDEO_SEEKED, ev);
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
}

module.exports = VideoPlayer;