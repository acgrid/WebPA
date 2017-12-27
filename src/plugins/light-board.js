const Plugin = require('./base'),
    Time = require('../lib/time'),
    $ = require('jquery');

function packet(program, current, total){
    total = total || program.duration || 0;
    return {
        id: program.id,
        alt: program.alt || '-',
        name: program.name || '',
        summary: program.summary,
        light: program.arrange.light || [],
        current,
        total
    };
}

class LightBoard{
    static name(){
        return 'light-board';
    }
    init(role, main, event){
        this.main = main;
        this.event = event;
        if(role === 'console'){
            this.currentProgram = null;
            // No need to add initial flag for it is not sandbox
            this.event.on("plugin.program.prepare", (program) => {
                this.currentProgram = program;
                this.event.emit("sync.light.program.data", packet(program));
            });
            this.event.on("plugin.media.playing", (source, offset, total) => {
                if(this.currentProgram) this.event.emit("sync.light.program.data", packet(this.currentProgram, offset, total));
            });
        }
        if(role === 'light'){
            this.$header = $('header');
            this.$table = $('tbody');
            this.$id = this.$header.find("strong");
            this.$name = this.$header.find("h2");
            this.$alt = this.$header.find("h3 > span");
            this.$progress = $("progress");
            this.$current = $(".current");
            this.$total = $(".total");
            this.$row = $('<tr><td class="time"></td><td class="color"></td><td class="note"></td></tr>');
            this.event.on("sync.light.program.data", (packet) => {
                this.$id.text(packet.id);
                this.$name.text(`(${packet.summary}) ${packet.name}`);
                this.$alt.text(packet.alt);
                this.$current.text(packet.current ? Time.secondsToMS(packet.current) : '-');
                this.$total.text(packet.total ? Time.secondsToMS(packet.total) : '-');
                if(packet.total){
                    this.$progress.prop({max: packet.total, value: packet.current});
                }else{
                    this.$progress.removeProp('max');
                }
                this.$table.empty();
                packet.light.forEach(light => {
                    const $row = this.$row.clone();
                    $row.find(".time").text(Time.secondsToMS(light.time));
                    $row.find(".note").text(light.note);
                    if(light.color) $row.find(".color").css("background-color", light.color);
                    if(packet.current > light.time){
                        $row.addClass("past");
                    }else if(light.time - packet.current < 10){
                        $row.addClass("highlight");
                    }
                    this.$table.append($row);
                });
                const $target = this.$table.find("tr.highlight").eq(0);
                if($target.length){
                    window.scroll(0, Math.max(0, $target.offset().top) - 180);
                }
            });
        }
    }
}

module.exports = LightBoard;