const Plugin = require('./base'),
    Time = require('../lib/time'),
    $ = require('jquery');

/**
 *
 * @param data
 * @param type
 * @returns {string}
 */
function RenderNothing(data, type){
    return type === 'display' ? '' : data;
}

const $fileIcon = $('<i class="fa fa-file fa-fw"></i>');
const $prepare = $('<button class="btn btn-action btn-prepare btn-warning btn-sm"><i class="fa fa-fw fa-exclamation" title="预备"></i></button>');
const $play = $('<button class="btn btn-action btn-execute btn-danger btn-sm"><i class="fa fa-fw fa-play" title="执行"></i></button>');

module.exports = class ProgramManager extends Plugin{
    static name(){
        return 'program-manager';
    }
    prepare($button){
        this.$table.find(".btn-action").prop("disabled", true);
        $button.siblings('.btn-execute').prop("disabled", false);
    }
    execute($button){
        this.event.emit("debug", "Execute program");
        $button.prop("disabled", true);
        console.log($button.closest(".control").data("control"));
    }
    autoProgramming(program, files){
        program.files = {};
        program.control = {start: [], listen: [], stop: []};
        this.event.emit("plugin.program.file.select", files, program.files); // There are sync events!
        if(!program.files.image && !program.files.video && !program.files.audio) return;
        if(program.files.video && program.files.audio){
            this.event.emit("debug", "Auto programming play video and audio is currently not supported");
            return;
        }
        if(program.files.image){
            program.control.start.push({event: "global.plugin.background.update", data: {url: program.files.image}});
            if(program.files.video || program.files.audio) program.control.stop.push({event: "global.plugin.background.pop"});
        }
        if(program.files.audio){
            program.control.start.push({event: "global.plugin.audio.open", data: {url: program.files.audio}});
            program.control.listen.push('promise.plugin.audio.stopped');
        }
        if(program.files.video){
            program.control.start.push({event: "global.plugin.video.open", data: {url: program.files.video}});
            program.control.listen.push('promise.plugin.video.stopped');
        }
    }
    init(type, main, event) {
        const that = this;
        this.main = main;
        this.event = event;
        this.sessions = new Set();
        if(type === 'console'){
            this.$manager = $(`
<div class="program-manager window-padding-top">
<table class="table table-bordered table-responsive table-striped table-condensed table-hover scroll">
<thead>
<tr>
<th>ID</th>
<th>场次</th>
<th><i class="fa fa-clock"></i></th>
<th>摘要</th>
<th>名义</th>
<th>名称</th>
<th>时长</th>
<th>时序</th>
<th>PA</th>
<th>备注</th>
<th>文件</th>
<th>操作</th>
</tr>
</thead>
<tbody></tbody>
</table>
</div>`);
            this.$table = this.$manager.find("table");
            this.$table.data("DataTableOptions", {
                order: [[0, 'asc']],
                autoWidth: false,
                columns: [
                    {data: {_: "sort", display: "_id", filter: "_id"}, width: "30px"},
                    {data: "session", "visible": false},
                    {data: 'program.clock', width: "3em", render: (data, type) => {
                        return type === 'display' ? Time.secondsToHMS(data) : data;
                    }},
                    {data: 'program.summary'},
                    {data: 'program.actor.unit', className: "nowrap"},
                    {data: 'program.name'},
                    {data: 'program.duration', width: "3em", render: (data, type) => {
                        return type === 'display' ? Time.secondsToMS(data) : data;
                    }},
                    {data: 'program.arrange.start'},
                    {data: 'program.arrange.pa'}, // TODO add MIC indicator
                    {data: 'program.arrange.remark'},
                    {data: 'files', defaultContent: [], className: "nowrap", searchable: false, orderable: false, render: RenderNothing, createdCell: (cell, files) => {
                        if(!files) return;
                        const $cell = $(cell);
                        ['image', 'audio', 'video'].forEach(type => {
                            if(files[type]){
                                $cell.append($fileIcon.clone().addClass(`fa-file-${type}`).attr('title', files[type]));
                            }
                        });
                    }},
                    {data: 'control', defaultContent: {}, searchable: false, orderable: false, render: RenderNothing, createdCell: (cell, control) => {
                        if(control && control.start && control.start.length){
                            const $cell = $(cell);
                            $cell.addClass("control").data("control", control);
                            $cell.append($prepare.clone());
                            $cell.append('&nbsp;');
                            $cell.append($play.clone());
                        }
                    }}
                ],
                ajax: {
                    url: `/program/${this.main.channel}`,
                    dataSrc: (programs) => {
                        this.programs = programs;
                        programs.forEach(program => {
                            this.sessions.add(program.session);
                            this.event.emit("plugin.media.match", new RegExp(`^${program._id}`), (files) => {
                                this.autoProgramming(program, files);
                            });
                        });
                        return programs;
                    },
                },
                buttons: [
                    {
                        text: '<i class="fa fa-fw fa-sync"></i>',
                        titleAttr: '同步',
                        className: 'btn btn-warning',
                        action: function (e, dt) {
                            dt.ajax.reload();
                        }
                    },
                    {
                        text: '<i class="fa fa-fw fa-unlock-alt"></i>',
                        titleAttr: '解锁',
                        className: 'btn btn-success',
                        action: function (e, dt) {
                            $(dt.table().body()).find("button").prop("disabled", false);
                        }
                    }
                ],
                initComplete: () => {
                    const dt = this.$table.DataTable();
                    let container;
                    new $.fn.dataTable.Buttons(dt, {
                        buttons: Array.from(this.sessions, (session) => {
                            return {
                                text: session,
                                className: "btn btn-default btn-select-session",
                                action: function (e, dt, node) {
                                    container.find(".btn-primary").addClass("btn-default").removeClass("btn-primary");
                                    dt.column(1).search(node.text()).draw();
                                    node.addClass("btn-primary").removeClass("btn-default");
                                }
                            };
                        })
                    });
                    container = dt.buttons(1, null).container();
                    container.prependTo($(dt.table().container()).find(".dt-buttons"));
                },
                createdRow: (row, data) => {
                    $(row).addClass("program-entry").data("program", data.program);
                },
                dom: 'Bfrtip',
            }).on("click", ".btn-prepare", function(){
                that.prepare($(this));
            }).on("click", ".btn-execute", function(){
                that.execute($(this));
            });
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-list");
                    $icon.find("p").text("流程表");
                    $icon.click(() => {
                        main.openWindow('program-manager', {
                            theme:       'info',
                            headerTitle: '流程表',
                            position:    'center-top 0 30',
                            contentSize: '1440 720',
                            content:     this.$manager.get(0)
                        });
                    });
                    return $icon;
                });
            });
            event.on("console.started", () => {
                event.emit("plugin.media.require.files");
            });
        }
    }
};