const Plugin = require('./base'),
    Time = require('../lib/time'),
    $ = require('jquery');

// Console ONLY. I have nothing to do with any sandboxes!
// global.* events are not used!

const EVENT_FB2K_PLAY_REQUEST = 'plugin.fb2k.play.request';

function request(cmd = '', data = {}) {
    return $.ajax({
        url: `/fb2k/${cmd}`,
        method: cmd === '' ? 'GET' : 'POST',
        cache: false,
        dataType: "json",
        timeout: cmd === '' ? 750 : 3000,
        data
    });
}
function formatIndex(index){
    index = parseInt(index);
    if(isNaN(index)) return '-';
    return index;
}

module.exports = class FB2K extends Plugin{
    static name(){
        return 'fb2k';
    }
    init(type, main, event) {
        this.main = main;
        this.event = event;
        if(type === 'console'){
            this.$player = $(`<div class="fb2k-player">
<p class="text-center">
<label for="fb2k-list">列表</label><input type="number" id="fb2k-list" min="0" />
<label for="fb2k-track">曲目</label><input type="number" id="fb2k-track" min="0" />
<label for="fb2k-volume">音量</label><input type="number" id="fb2k-volume" min="0" max="100" />
</p>
<p class="text-center">
<button id="fb2k-play"><i class="fa fa-2x fa-fw fa-folder-open"></i></button>
<button id="fb2k-pause"><i class="fa fa-2x fa-fw fa-play"></i><i class="fa fa-2x fa-fw fa-pause"></i></button>
<button id="fb2k-stop"><i class="fa fa-2x fa-fw fa-stop"></i></button>
</p>
<p class="text-center">
<progress></progress><span id="current">-</span>/<span id="total"></span>
<input type="time" value="00:00" /> <button id="fb2k-seek"><i class="fa fa-fw fa-angle-double-right"></i></button>
</p>
<p class="text-center status"></p>
<p class="text-center path"></p>
</div>`);
            this.$player.on("focus", "input", function(){
                $(this).data("focused", true);
            });
            this.$player.on("blur", "input", function(){
                $(this).data("focused", false);
            });
            this.$list = this.$player.find("#fb2k-list");
            this.$track = this.$player.find("#fb2k-track");
            this.$volume = this.$player.find("#fb2k-volume");
            this.$play = this.$player.find("#fb2k-play");
            this.$pause = this.$player.find("#fb2k-pause");
            this.$stop = this.$player.find("#fb2k-stop");
            this.$current = this.$player.find("#current");
            this.$total = this.$player.find("#total");
            this.$progress = this.$player.find("progress");
            this.$status = this.$player.find(".status");
            this.$path = this.$player.find(".path");
            this.$time = this.$player.find("input[type=time]");
            // PLAY
            this.$play.click(() => {
                let list = parseInt(this.$list.val()), track = parseInt(this.$track.val());
                if(isNaN(list) || isNaN(track)) return;
                event.emit(EVENT_FB2K_PLAY_REQUEST, list, track)
            });
            event.on(EVENT_FB2K_PLAY_REQUEST, (list, track) => {
                request('play', {list, track}).then(() => {
                    this.$list.val("");
                    this.$track.val("");
                });
            });
            // PAUSE
            this.$pause.click(() => {
                request('pause');
            });
            // STOP
            this.$stop.click(() => {
                request('stop')
            });
            // SEEK
            this.$player.find("#fb2k-seek").click(() => {
                if(!this.length){
                    this.event.emit("debug", "FB2K Length is unknown so unable to seek.");
                    return;
                }
                const position = Math.round(Time.msToSeconds(this.$time.val()) / this.length * 100);
                event.emit("debug", `Seeking FB2K to ${position}`);
                request('seek', {position});
            });
            this.$volume.blur(() => {
                let volume = parseInt(this.$volume.val());
                if(isNaN(volume)) return;
                request('volume', {volume}).then(() => {
                    this.$volume.val("");
                });
            });
            // UPDATE
            let updateHandle;
            event.on("console.started", () => {
                updateHandle = setInterval(this.update.bind(this), 1000);
            });
            event.on("console.stopping", () => {
                clearInterval(updateHandle);
            });
            // UI
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-music");
                    $icon.find("p").text("foobar2000");
                    $icon.click(() => {
                        main.openWindow('fb2k-player', {
                            theme:       'info',
                            headerTitle: 'foobar2000',
                            position:    'center-top 0 30',
                            contentSize: '480 200',
                            content:     this.$player.get(0)
                        });
                    });
                    return $icon;
                });
            });
        }
    }
    update(){
        if(!this.main.hasWindow('fb2k-player')) return;
        request().then((fb2k) => {
            if(fb2k && fb2k.ok){
                this.$status.text(`${(new Date()).toLocaleTimeString()} ONLINE`);
                const length = parseInt(fb2k["itemPlayingLen"]),
                    position = parseInt(fb2k["itemPlayingPos"]),
                    playing = fb2k["isPlaying"] === "1",
                    paused = fb2k["isPaused"] === "1";
                if(length > 0){
                    this.length = length;
                    this.$progress.attr({max: length, value: position});
                    this.$current.text(Time.secondsToMS(position));
                    this.$total.text(Time.secondsToMS(length));
                }else{
                    this.$progress.removeAttr("value");
                    this.$current.text('-');
                    this.$total.text('-');
                }
                this.$list.prop("placeholder", formatIndex(fb2k["playlistPlaying"]));
                this.$track.prop("placeholder", formatIndex(fb2k["playingItem"]));
                this.$volume.prop("placeholder", fb2k['volume']);
                this.$path.text(playing ? fb2k["helper3"] : '');
                this.$play.toggleClass("on", playing);
                this.$pause.toggleClass("on", paused);
                this.$stop.toggleClass("on", !playing && !paused);
            }else{
                this.reset();
            }
        }).catch(this.reset.bind(this));
    }
    reset(){
        this.$status.text(`${(new Date()).toLocaleTimeString()} OFFLINE`);
        this.length = null;
        this.$progress.removeAttr("value");
        this.$current.text('-');
        this.$total.text('-');
        this.$path.text('');
        this.$list.prop("placeholder", "");
        this.$track.prop("placeholder", "");
        this.$volume.prop("placeholder", "");
        this.$play.removeClass("on");
        this.$pause.removeClass("on");
        this.$stop.removeClass("on");
    }
};