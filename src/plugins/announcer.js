const DOMPlugin = require('./dom'),
    dot = require('dot-wild'),
    $ = require('jquery'),
    SongFields = {
        Y: '年代',
        L: '作词',
        C: '作曲',
        A: '编曲',
        V: '原唱',
        F: '编舞'
    };

const
    SANDBOX_ANNOUNCER_PROGRAM = 'sandbox.announcer.program.show',
    SANDBOX_ANNOUNCER_PROGRAM_HIDE = 'sandbox.announcer.program.hide',
    SANDBOX_ANNOUNCER_SONG = 'sandbox.announcer.song.show',
    SANDBOX_ANNOUNCER_SONG_HIDE = 'sandbox.announcer.show.hide';

// TODO configurable
const LANG_TRANSLATED = 'zh-CN';
const TIMER_MAIN_OFFSET = 2,
    TIMER_MAIN_DURATION = 5,
    TIMER_SONG_DURATION = 8;

function setLangText($dom, lang, text){
    $dom.attr('lang', lang).text(text);
}

function isNonEmptyArray(value){
    return Array.isArray(value) && value.length > 0;
}

function setMultilingual(data, $original, $translated){
    const keys = Object.keys(data);
    if(keys.length === 1 && keys[0] === LANG_TRANSLATED){
        setLangText($original, LANG_TRANSLATED, data[LANG_TRANSLATED]);
    }else{
        keys.forEach(lang => {
            setLangText(lang === LANG_TRANSLATED ? $translated : $original, lang, data[lang]);
        });
    }
}

module.exports = class Announcer extends DOMPlugin{
    constructor(){
        super('announcer');
        this.$dom = $(`
<div class="announcer-window full">
    <div class="program-info hidden">
        <h2></h2>
        <p><b></b><span></span></p>
    </div>
    <div class="song-info hidden">
        <h2><span></span><small></small></h2>
        <h3><span></span><small></small></h3>
        <dl></dl>
    </div>
</div>
`);
        this.$program = this.$dom.find(".program-info");
        this.$name = this.$program.find('h2');
        this.$summary = this.$program.find('p > b');
        this.$performers = this.$program.find("p > span");
        this.$song = this.$dom.find(".song-info");
        this.$originalTitle = this.$song.find("h2 > span");
        this.$translatedTitle = this.$song.find("h2 > small");
        this.$originalProvenance = this.$song.find("h3 > span");
        this.$translatedProvenance = this.$song.find("h3 > small");
        this.$credits = this.$song.find("dl");
        this.$dt = $('<dt></dt>');
        this.$dd = $('<dd></dd>');
        this.empty();
    }
    static name(){
        return 'announcer';
    }
    createDOM(){
        return this.$dom;
    }
    empty(){
        this.$summary.text("");
        this.$name.text("");
        this.$performers.text("");
        this.$originalTitle.text("");
        this.$translatedTitle.text("");
        this.$originalProvenance.text("");
        this.$translatedProvenance.text("");
        this.$credits.empty();
        this.$program.addClass("hidden");
        this.$song.addClass("hidden");
    }
    myInit(type, main, event){
        this.event = event;
        this.program = null;
        this.showMain = true;
        this.songTimers = [];
        this.songIndex = 0;
        event.on(SANDBOX_ANNOUNCER_PROGRAM, (packet) => {
            this.$name.text(packet.name);
            this.$summary.text(packet.summary);
            this.$performers.text(packet.performers.join(' '));
            if(this.$program.hasClass("hidden")) this.$program.removeClass("hidden");
            this.$program.animateCss("bounceInLeft");
        });
        event.on(SANDBOX_ANNOUNCER_SONG, (song) => {
            setMultilingual(song.N, this.$originalTitle, this.$translatedTitle);
            setMultilingual(song.P, this.$originalProvenance, this.$translatedProvenance);
            this.$credits.empty();
            Object.keys(SongFields).forEach(field => {
                if(song[field]){
                    const addTitle = () => {
                        this.$credits.append(this.$dt.clone().text(SongFields[field]));
                    };
                    if(isNonEmptyArray(song[field])){
                        addTitle();
                        song[field].forEach(item => {
                            this.$credits.append(this.$dd.clone().text(item));
                        });
                    }else if($.isPlainObject(song[field])){
                        const languages = Object.keys(song[field]);
                        if(languages.length){
                            addTitle();
                            languages.forEach(lang => {
                                if(song[field][lang]) this.$credits.append(this.$dd.clone().attr("lang", lang).text(song[field][lang]));
                            });
                        }
                    }
                }
            });
            if(this.$song.hasClass("hidden")) this.$song.removeClass("hidden");
            this.$song.animateCss("bounceInRight");
        });
        event.on(SANDBOX_ANNOUNCER_PROGRAM_HIDE, () => {
            this.$program.animateCss("bounceOut", () => {
                this.$program.addClass("hidden");
            });
        });
        event.on(SANDBOX_ANNOUNCER_SONG_HIDE, () => {
            this.$song.animateCss("bounceOut", () => {
                this.$song.addClass("hidden");
            });
        });
        if(type === 'console'){
            event.on("plugin.media.playing", (source, current) => {
                if(this.program){
                    // Program logic
                    if(this.showMain){
                        if(current > TIMER_MAIN_OFFSET && this.$program.hasClass("hidden")) event.emit(SANDBOX_ANNOUNCER_PROGRAM, {
                            name: this.program.name,
                            summary: this.program.summary,
                            performers: dot.get(this.program, 'actor.performers') || [],
                            initial: true
                        });
                        if(current > TIMER_MAIN_OFFSET + TIMER_MAIN_DURATION && !this.$program.hasClass("hidden")){
                            event.emit(SANDBOX_ANNOUNCER_PROGRAM_HIDE, {initial: true});
                            this.showMain = false;
                        }
                    }
                    // Song logic
                    if(this.songTimers.length){
                        if(current > this.songTimers[0] && this.$song.hasClass("hidden")){
                            event.emit(SANDBOX_ANNOUNCER_SONG, $.extend({}, this.program['songs'][this.songIndex], {initial: true}));
                        }
                        if(current > this.songTimers[0] + TIMER_SONG_DURATION && !this.$song.hasClass("hidden")){
                            event.emit(SANDBOX_ANNOUNCER_SONG_HIDE, {initial: true});
                            this.songIndex++;
                            this.songTimers.shift();
                        }
                    }
                }
            });
            // TODO ON MEDIA Interrupted
            // TRIGGER BY PROGRAM CONTROL
            event.on('plugin.program.execute', (program) => {
                if(dot.get(program, 'songs') && dot.get(program, 'arrange.hints.announcer')){
                    this.showMain = true;
                    this.songTimers = [];
                    this.songIndex = 0;
                    this.program = program;
                    program['songs'].forEach((song, index) => {
                        if(song['T']){
                            this.songTimers.push(song['T'])
                        }else{
                            this.songTimers.push(TIMER_MAIN_OFFSET + index * TIMER_SONG_DURATION);
                        }
                    });
                    console.log(this.songTimers);
                }
            });
            event.on('plugin.program.finish', () => {
                event.emit(SANDBOX_ANNOUNCER_SONG_HIDE, {initial: true});
                event.emit(SANDBOX_ANNOUNCER_PROGRAM_HIDE, {initial: true});
                this.program = null; // Unlink
                this.empty();
            });
        }
    }
};