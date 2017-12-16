const Plugin = require('./base'),
    $ = require('jquery');

module.exports = class ProgramManager extends Plugin{
    constructor(){
        super();
    }
    static name(){
        return 'program-manager';
    }
    init(type, main, event) {
        this.main = main;
        this.event = event;
        if(type === 'console'){
            this.$table = $(`
<div class="program-manager">
<p class="text-center"><button id="file-manager-refresh">刷新</button></p>
<table class="scroll">
<thead>
</thead>
<tbody></tbody>
</table>
</div>`);
            this.$row = $('<tr class="program"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td class="pre"></td><td></td><td><button class="info">预备</button>&nbsp;&nbsp;&nbsp;<button class="play">播放</button></td></tr>');
            this.$table.find('#file-manager-refresh').click(this.refresh.bind(this));
            this.$body = this.$table.find("tbody");
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-list");
                    $icon.find("p").text("节目表");
                    $icon.click(() => {
                        main.openWindow('program-manager', {
                            theme:       'info',
                            headerTitle: '节目表',
                            position:    'center-top 0 30',
                            contentSize: '1440 720',
                            content:     this.$table.get(0)
                        });
                    });
                    return $icon;
                });
            });
            event.on("console.started", () => {
                this.refresh();
            });
        }
    }
    refresh(){
        this.$body.empty();
        $.ajax({
            url: `/programs/${this.main.channel}.json`,
            method: 'GET',
            cache: false,
            dataType: "json"
        }).then((programs) => {
            if(Array.isArray(programs)){
                programs.forEach((program, index) => {
                    const $row = this.$row.clone().
                    find("td:nth-child(1)").text(program['SESSION']).end().
                    find("td:nth-child(2)").text(program['CHAPTER'] + program['SEQUENCE']).end().
                    find("td:nth-child(3)").text(program['CLOCK']).end().
                    find("td:nth-child(4)").text(program['LENGTH']).end().
                    find("td:nth-child(5)").text(program['TYPE']).end().
                    find("td:nth-child(6)").text(program['UNIT']).end().
                    find("td:nth-child(7)").text(program['SONG']).end().
                    find("td:nth-child(8)").text(program['ARRANGE']).end().
                    find("td:nth-child(9)").text(program['LIGHT']).end().
                    find("td:nth-child(10)").text(program['SPECIAL']).end().
                    data("index", index);
                    if(program['FB2K_PL'] !== null && program['FB2K_IDX'] !== null){
                        $row.find("td:nth-child(11)").text((program['FB2K_PL'] + 1) + "-" + (program['FB2K_IDX'] + 1)).addClass('enabled');
                        $row.data("fb2k", {track: program['FB2K_PL'], list: program['FB2K_IDX']});
                    }else{
                        $row.find("td:nth-child(11)").text('-').addClass('disabled')
                    }
                    if(program['MPC']){
                        $row.find("td:nth-child(12)").text('Y').attr('title', program['MPC']).addClass('enabled');
                        $row.data("video", {filename: program['MPC']});
                    }else{
                        $row.find("td:nth-child(12)").text('N').addClass('disabled')
                    }
                    if(program['LRC']){
                        $row.find("td:nth-child(13)").text('Y').attr('title', program['LRC']).addClass('enabled');
                    }else{
                        $row.find("td:nth-child(13)").text('N').addClass('disabled')
                    }
                    if(program['LOOP']){
                        $row.find("td:nth-child(14)").text('T').addClass('enabled');
                    }else{
                        $row.find("td:nth-child(14)").text('F').addClass('disabled')
                    }
                    this.$body.append($row);
                });
            }else{
                this.event.emit("debug", `Bad programs list: ${JSON.stringify(programs)}`);
            }
        });
    }
};