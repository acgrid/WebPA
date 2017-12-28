const DOMPlugin = require('./dom'),
    $ = require('jquery');

const EVENT_SANDBOX_CAMERA_CONFIGURE = 'sandbox.camera.configure',
    EVENT_SANDBOX_CAMERA_OPEN = 'sandbox.camera.open',
    EVENT_SANDBOX_CAMERA_PLAY = 'sandbox.camera.play',
    EVENT_SANDBOX_CAMERA_PAUSE = 'sandbox.camera.pause',
    EVENT_SANDBOX_CAMERA_STOP = 'sandbox.camera.stop',
    EVENT_SANDBOX_CAMERA_PREVIEW = 'sandbox.camera.preview',

    EVENT_GLOBAL_CAMERA_LOCAL_CONFIGURE = 'global.plugin.camera.configure',
    EVENT_GLOBAL_CAMERA_OPEN = 'global.plugin.camera.open',
    EVENT_GLOBAL_CAMERA_PLAY = 'global.plugin.camera.play',
    EVENT_GLOBAL_CAMERA_PAUSE = 'global.plugin.camera.pause',
    EVENT_GLOBAL_CAMERA_STOP = 'global.plugin.camera.stop',
    EVENT_GLOBAL_CAMERA_PREVIEW = 'global.plugin.camera.preview',

    EVENT_MONITOR_CAMERA_OPENED = 'promise.plugin.camera.opened',
    EVENT_MONITOR_CAMERA_PLAYING = 'promise.plugin.camera.playing',
    EVENT_MONITOR_CAMERA_PAUSED = 'promise.plugin.camera.paused',
    EVENT_MONITOR_CAMERA_RESUMED = 'promise.plugin.camera.resumed',
    EVENT_MONITOR_CAMERA_STOPPED = 'promise.plugin.camera.stopped'
;

function ensureUserMedia(kind, onFound, onNotFound) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
        if(typeof onNotFound === 'function') onNotFound(null);
        return;
    }
    navigator.mediaDevices.getUserMedia({audio: false, video: true}).then(stream => {
        navigator.mediaDevices.enumerateDevices().then(function(devices) {
            devices.forEach((device) => {
                if(kind === device.kind){
                    onFound(device);
                }
            });
        }).catch(function(err){
            if(typeof onNotFound === 'function'){
                onNotFound(err);
            }else{
                console.log(err);
            }
        });
        stream.getVideoTracks()[0].stop();
    });
}

class Camera extends DOMPlugin{
    static name(){
        return 'camera';
    }
    constructor(){
        super('camera');
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
        this.previewState = false;
        // SANDBOX
        event.on(EVENT_SANDBOX_CAMERA_CONFIGURE, this.setVideoProps.bind(this));
        event.on(EVENT_SANDBOX_CAMERA_OPEN, (data) => {
            this.$video.addClass("hidden");
            if(data.deviceId && data.constraints){
                data.constraints.deviceId = data.deviceId;
                navigator.mediaDevices.getUserMedia({audio: false, video: data.constraints}).then(stream => {
                    event.emit(EVENT_MONITOR_CAMERA_OPENED);
                    this.$video.toggleClass("hidden", this.previewState);
                    this.video.srcObject = stream;
                    this.play();
                });
            }
        });
        event.on(EVENT_SANDBOX_CAMERA_PLAY, () => {
            this.$video.toggleClass("hidden", this.previewState);
            this.video.play();
        });
        event.on(EVENT_SANDBOX_CAMERA_PAUSE, () => {
            this.video.pause();
        });
        event.on(EVENT_SANDBOX_CAMERA_STOP, () => {
            this.$video.addClass("hidden");
            this.video.srcObject.getVideoTracks()[0].stop();
        });
        event.on(EVENT_SANDBOX_CAMERA_PREVIEW, (data) => {
            if(type === 'monitor'){
                console.log(data);
                this.previewState = data.state;
                this.$video.toggleClass("hidden", this.previewState);
            }
        });
        if(type === 'console'){
            event.on(EVENT_GLOBAL_CAMERA_LOCAL_CONFIGURE, this.setVideoProps.bind(this));
            this.$player = $(`<div class="camera-player">
<select id="camera-select" class="block"></select>
<p class="text-center"><label for="camera-width">宽</label><input type="number" id="camera-width" value="1920" />x<label for="camera-height">高</label><input type="number" id="camera-height" value="1080" /></p>
<p class="text-center">
<button id="camera-open"><i class="fa fa-2x fa-fw fa-folder-open"></i></button>
<button id="camera-play" class="camera-after-open" disabled><i class="fa fa-2x fa-fw fa-play"></i></button>
<button id="camera-pause" class="camera-after-open" disabled><i class="fa fa-2x fa-fw fa-pause"></i></button>
<button id="camera-stop" class="camera-after-open" disabled><i class="fa fa-2x fa-fw fa-stop"></i></button>
</p>
<p class="text-center"><input type="checkbox" id="video-preview" /><label for="video-preview">仅预览</label></p>
</div>`);
            this.$controls = this.$player.find(".camera-after-open");
            this.$deviceOption = $('<option></option>');
            this.$devices = this.$player.find("select");
            this.$width = this.$player.find("#camera-width");
            this.$height = this.$player.find("#camera-height");
            this.$preview = this.$player.find("#video-preview");
            ensureUserMedia("videoinput", (device) => {
                this.$devices.append(this.$deviceOption.clone().attr("value", device.deviceId).text(device.label));
            });
            // OPEN
            this.$player.find("#camera-open").click(() => {
                this.open(this.$devices.val(), { width: this.$width.val() || 1920, height: this.$height.val() || 1080 });
            });
            event.on(EVENT_GLOBAL_CAMERA_OPEN, (data) => {
                this.$devices.val(data.deviceId);
                this.$controls.prop("disabled", true);
                event.emit(EVENT_SANDBOX_CAMERA_OPEN, data);
            });
            event.on(EVENT_MONITOR_CAMERA_OPENED, () => {
                this.$controls.prop("disabled", false);
            });
            // PLAY
            this.$player.find("#camera-play").click(() => {
                this.play();
            });
            event.on(EVENT_GLOBAL_CAMERA_PLAY, (data) => {
                event.emit(EVENT_SANDBOX_CAMERA_PLAY, data);
            });
            this.$video.on("playing", (ev) => {
                event.emit(EVENT_MONITOR_CAMERA_PLAYING, ev);
            });
            // PAUSE
            this.$player.find("#camera-pause").click(() => {
                this.pause();
            });
            event.on(EVENT_GLOBAL_CAMERA_PAUSE, (data) => {
                event.emit(EVENT_SANDBOX_CAMERA_PAUSE, data);
            });
            this.$video.on("pause", (ev) => {
                event.emit(EVENT_MONITOR_CAMERA_PAUSED, ev);
            });
            this.$video.on("play", (ev) => {
                event.emit(EVENT_MONITOR_CAMERA_RESUMED, ev);
            });
            // STOP
            this.$player.find("#camera-stop").click(() => {
                this.stop();
            });
            event.on(EVENT_GLOBAL_CAMERA_STOP, (data) => {
                event.emit(EVENT_SANDBOX_CAMERA_STOP, data);
            });
            this.$video.on("end", (ev) => {
                event.emit(EVENT_MONITOR_CAMERA_STOPPED, ev);
            });
            // PREVIEW
            this.$preview.change(() => {
                this.preview(this.$preview.prop("checked"));
            });
            event.on(EVENT_GLOBAL_CAMERA_PREVIEW, (data) => {
                event.emit(EVENT_SANDBOX_CAMERA_PREVIEW, data);
            });
            // UI
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-camera");
                    $icon.find("p").text("视频捕捉");
                    $icon.click(() => {
                        main.openWindow('video-player', {
                            theme:       'info',
                            headerTitle: '视频捕捉',
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
    open(deviceId, constraints = {}, initial = true){
        this.event.emit(EVENT_GLOBAL_CAMERA_OPEN, {deviceId, constraints, initial});
    }
    play(initial = true){
        this.event.emit(EVENT_GLOBAL_CAMERA_PLAY, {initial});
    }
    pause(initial = true){
        this.event.emit(EVENT_GLOBAL_CAMERA_PAUSE, {initial});
    }
    stop(initial = true){
        this.event.emit(EVENT_GLOBAL_CAMERA_STOP, {initial});
    }
    preview(state, initial = true){
        this.event.emit(EVENT_GLOBAL_CAMERA_PREVIEW, {state, initial});
    }
}

module.exports = Camera;