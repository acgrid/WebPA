const DOMPlugin = require('./dom'),
    Time = require('../lib/time'),
    $ = require('jquery');

const SEEKING_OFFSET = 5;

const EVENT_SANDBOX_AUDIO_CONFIGURE = 'sandbox.audio.configure',
    EVENT_SANDBOX_AUDIO_OPEN = 'sandbox.audio.open',
    EVENT_SANDBOX_AUDIO_PLAY = 'sandbox.audio.play',
    EVENT_SANDBOX_AUDIO_PAUSE = 'sandbox.audio.pause',
    EVENT_SANDBOX_AUDIO_STOP = 'sandbox.audio.stop',
    EVENT_SANDBOX_AUDIO_SEEK = 'sandbox.audio.seek',

    EVENT_GLOBAL_AUDIO_LOCAL_CONFIGURE = 'global.plugin.audio.configure',
    EVENT_GLOBAL_AUDIO_OPEN = 'global.plugin.audio.open',
    EVENT_GLOBAL_AUDIO_PLAY = 'global.plugin.audio.play',
    EVENT_GLOBAL_AUDIO_PAUSE = 'global.plugin.audio.pause',
    EVENT_GLOBAL_AUDIO_STOP = 'global.plugin.audio.stop',
    EVENT_GLOBAL_AUDIO_SEEK = 'global.plugin.audio.seek',

    EVENT_MONITOR_AUDIO_CAN_PLAY = 'promise.plugin.audio.canplay',
    EVENT_MONITOR_AUDIO_PLAYING = 'promise.plugin.audio.playing',
    EVENT_MONITOR_AUDIO_PAUSED = 'promise.plugin.audio.paused',
    EVENT_MONITOR_AUDIO_RESUMED = 'promise.plugin.audio.resumed',
    EVENT_MONITOR_AUDIO_STOPPED = 'promise.plugin.audio.stopped',
    EVENT_MONITOR_AUDIO_SEEKING = 'promise.plugin.audio.seeking',
    EVENT_MONITOR_AUDIO_SEEKED = 'promise.plugin.audio.seeked'
;

function setFileIcon($icon){
    $icon.removeClass("fa-file").addClass("fa-file-audio");
}

class AudioPlayer extends DOMPlugin{
    static name(){
        return 'audio';
    }
    constructor(){
        super('audio');
        this.$audio = $(`<audio class="hidden"></audio>`);
        this.audio = this.$audio.get(0);
    }
    createDOM(){
        return this.$audio;
    }
    setAudioProps(props){
        this.$audio.prop(props);
    }
    myInit(type, main, event){
        this.event = event;
        this.$audio.on("ended", () => {
            this.$audio.addClass("hidden");
        });
        // SANDBOX
        event.on(EVENT_SANDBOX_AUDIO_CONFIGURE, this.setAudioProps.bind(this));
        event.on(EVENT_SANDBOX_AUDIO_OPEN, (data) => {
            if(data.url) this.$audio.prop("src", data.url);
        });
        event.on(EVENT_SANDBOX_AUDIO_PLAY, () => {
            this.audio.play();
        });
        event.on(EVENT_SANDBOX_AUDIO_PAUSE, () => {
            this.audio.pause();
        });
        event.on(EVENT_SANDBOX_AUDIO_STOP, () => {
            this.$audio.addClass("hidden");
            this.audio.pause();
            this.audio.currentTime = 0;
        });
        event.on(EVENT_SANDBOX_AUDIO_SEEK, (data) => {
            if(data.time) this.audio.currentTime = data.time;
        });
        if(type === 'console'){
            event.on(EVENT_GLOBAL_AUDIO_LOCAL_CONFIGURE, this.setAudioProps.bind(this));
            this.$player = $(`<div class="audio-player"><input type="url" class="block" id="audio-url" placeholder="URL" />
<p class="text-center">
<button id="audio-open"><i class="fa fa-2x fa-fw fa-folder-open"></i></button>
<button id="audio-play" class="audio-after-open" disabled><i class="fa fa-2x fa-fw fa-play"></i></button>
<button id="audio-pause" class="audio-after-open" disabled><i class="fa fa-2x fa-fw fa-pause"></i></button>
<button id="audio-stop" class="audio-after-open" disabled><i class="fa fa-2x fa-fw fa-stop"></i></button>
<button id="audio-backward" class="audio-after-open" disabled><i class="fa fa-2x fa-fw fa-backward"></i></button>
<button id="audio-forward" class="audio-after-open" disabled><i class="fa fa-2x fa-fw fa-forward"></i></button>
</p>
<p class="text-center">
<progress></progress>&nbsp;<span id="current">-</span>/<span id="total"></span>
</p>
<p class="text-center">
<input type="time" value="00:00" /> <button id="audio-seek" class="audio-after-open" disabled><i class="fa fa-fw fa-angle-double-right"></i></button>
</p>
</div>`);
            this.$controls = this.$player.find(".audio-after-open");
            this.$url = this.$player.find("input[type=url]");
            this.$time = this.$player.find("input[type=time]");
            this.$current = this.$player.find("#current");
            this.$total = this.$player.find("#total");
            this.$progress = this.$player.find("progress");
            let updateHandle;
            // OPEN
            this.$player.find("#audio-open").click(() => {
                this.open(this.$url.val());
            });
            event.on(EVENT_GLOBAL_AUDIO_OPEN, (data) => {
                const url = data.url || "";
                this.$url.val(url);
                this.$controls.prop("disabled", true);
                event.emit(EVENT_SANDBOX_AUDIO_OPEN, data);
                this.play();
            });
            this.$audio.on("canplay", (ev) => {
                this.$controls.prop("disabled", false);
                event.emit(EVENT_MONITOR_AUDIO_CAN_PLAY, ev);
            });
            // PLAY
            this.$player.find("#audio-play").click(() => {
                this.play();
            });
            event.on(EVENT_GLOBAL_AUDIO_PLAY, (data) => {
                event.emit(EVENT_SANDBOX_AUDIO_PLAY, data);
            });
            this.$audio.on("playing", (ev) => {
                event.emit(EVENT_MONITOR_AUDIO_PLAYING, ev);
            });
            // PAUSE
            this.$player.find("#audio-pause").click(() => {
                this.pause();
            });
            event.on(EVENT_GLOBAL_AUDIO_PAUSE, (data) => {
                event.emit(EVENT_SANDBOX_AUDIO_PAUSE, data);
            });
            this.$audio.on("pause", (ev) => {
                event.emit(EVENT_MONITOR_AUDIO_PAUSED, ev);
            });
            this.$audio.on("play", (ev) => {
                event.emit(EVENT_MONITOR_AUDIO_RESUMED, ev);
            });
            // STOP
            this.$player.find("#audio-stop").click(() => {
                this.stop();
            });
            event.on(EVENT_GLOBAL_AUDIO_STOP, (data) => {
                event.emit(EVENT_SANDBOX_AUDIO_STOP, data);
            });
            this.$audio.on("end", (ev) => {
                event.emit(EVENT_MONITOR_AUDIO_STOPPED, ev);
            });
            // SEEK
            this.$player.find("#audio-seek").click(() => {
                const time = Time.msToSeconds(this.$time.val());
                event.emit("debug", `Seeking audio ${time}`);
                this.seek(time);
            });
            this.$player.find("#audio-backward").click(() => {
                this.seek(this.audio.currentTime - SEEKING_OFFSET);
            });
            this.$player.find("#audio-forward").click(() => {
                this.seek(this.audio.currentTime + SEEKING_OFFSET);
            });
            event.on(EVENT_GLOBAL_AUDIO_SEEK, (data) => {
                event.emit(EVENT_SANDBOX_AUDIO_SEEK, data);
            });
            this.$audio.on("seeking", (ev) => {
                event.emit(EVENT_MONITOR_AUDIO_SEEKING, ev);
            });
            this.$audio.on("seeked", (ev) => {
                event.emit(EVENT_MONITOR_AUDIO_SEEKED, ev);
            });
            // REGISTER
            ['mp3', 'flac', 'wav', 'ogg'].forEach((extension) => {
                event.on(`plugin.file.icon.${extension}`, setFileIcon);
                event.on(`plugin.file.operation.${extension}`, this.setFileOperation.bind(this));
            });
            // UI
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-headphones");
                    $icon.find("p").text("音频播放");
                    $icon.click(() => {
                        main.openWindow('audio-player', {
                            theme:       'info',
                            headerTitle: '音频播放',
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
        this.event.emit(EVENT_GLOBAL_AUDIO_OPEN, {url, initial});
    }
    play(initial = true){
        this.event.emit(EVENT_GLOBAL_AUDIO_PLAY, {initial});
    }
    pause(initial = true){
        this.event.emit(EVENT_GLOBAL_AUDIO_PAUSE, {initial});
    }
    stop(initial = true){
        this.event.emit(EVENT_GLOBAL_AUDIO_STOP, {initial});
    }
    seek(time, initial = true){
        this.event.emit(EVENT_GLOBAL_AUDIO_SEEK, {time, initial});
    }
    setUrlFromDOM(ev){
        this.open($(ev.target).closest(".file-entry").data("url"));
    }
    setFileOperation($cell){
        const $button = $('<button>播放</button>');
        $button.click(this.setUrlFromDOM.bind(this));
        $cell.append($button);
    }
    update(){
        const total = this.audio.duration, current = this.audio.currentTime;
        if(total){
            this.$current.text(Time.secondsToMS(current));
            this.$total.text(Time.secondsToMS(total));
            this.$progress.prop({max: total, value: current});
        }else{
            this.$current.text('-');
            this.$total.text('-');
            this.$progress.removeProp('max');
        }
    }
}

module.exports = AudioPlayer;