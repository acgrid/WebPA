const Plugin = require('./base'),
    Time = require('../lib/time'),
    SongFields = require('./song-fields'),
    ActorFields = require('./actor-fields'),
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

function isNonEmptyArray(value){
    return Array.isArray(value) && value.length > 0;
}

const $fileIcon = $('<i class="fa fa-file fa-fw"></i>');
const $prepare = $('<button class="btn btn-action btn-prepare btn-warning btn-sm"><i class="fa fa-fw fa-exclamation" title="预备"></i></button>');
const $play = $('<button class="btn btn-action btn-execute btn-danger btn-sm" disabled><i class="fa fa-fw fa-play" title="执行"></i></button>');

module.exports = class ProgramManager extends Plugin{
    static name(){
        return 'program-manager';
    }
    unlock(){
        this.locked = false;
        this.$table.find(".btn-prepare").prop("disabled", false);
        this.$table.find(".btn-execute").prop("disabled", true);
    }
    prepare($button){
        $button.closest("tr").click();
        this.locked = true;
        this.$table.find(".btn-action").prop("disabled", true);
        $button.siblings('.btn-execute').prop("disabled", false);
        this.event.emit('plugin.program.prepare', $button.closest('.program-entry').data('program')); // LOCAL EVENT
        const control = $button.closest(".control").data("control");
        if(control && Array.isArray(control.prepare)) this.emitActions(control.prepare);
    }
    emitActions(actions){
        actions.forEach(action => {
            if(action.event){
                action.data = action.data || {};
                action.data.initial = true;
                this.event.emit(action.event, action.data);
            }
        });
    }
    execute($button){
        this.event.emit("debug", "Execute program");
        $button.prop("disabled", true);
        const control = $button.closest(".control").data("control");
        if(control){
            this.event.emit('plugin.program.execute', $button.closest('.program-entry').data('program')); // LOCAL EVENT
            if(Array.isArray(control.start)) this.emitActions(control.start);
            if(control.listen) {
                this.event.emit("debug", `Register stop listener: ${control.listen}`);
                this.event.once(control.listen, () => {
                    this.unlock();
                    this.event.emit('plugin.program.finish');
                    if(Array.isArray(control.stop) && control.stop.length) this.emitActions(control.stop);
                });
            }
        }
    }
    autoProgramming(program, files){
        program.files = {};
        program.control = {prepare: [], start: [], listen: null, stop: []};
        this.event.emit("plugin.program.file.select", files, program.files); // There are sync events!
        if(program.files.random){
            program.control.start.push({event: "global.plugin.roll.url", data: {url: program.files.random}});
            program.control.listen = 'promise.plugin.roll.hidden';
        }
        if(program.files.video){
            if(program.files.video.indexOf('LOOP') !== -1){
                program.control.start.push({event: "global.plugin.video.loop", data: {loop: true}});
                program.control.stop.push({event: "global.plugin.video.loop", data: {loop: false}});
            }
            program.control.prepare.push({event: "global.plugin.video.open", data: {url: program.files.video, autoplay: false}});
            program.control.start.push({event: "global.plugin.video.play", data: {}});
            program.control.listen = 'promise.plugin.video.stopped';
            return; // Skip image & audio if video is found
        }
        if(program.files.image){
            program.control.start.push({event: "global.plugin.background.update", data: {url: program.files.image}});
            if(program.files.video || program.files.audio) program.control.stop.push({event: "global.plugin.background.pop"});
        }
        if(program.files.audio){
            if(program.files.audio.indexOf('LOOP') !== -1){
                program.control.start.push({event: "global.plugin.audio.loop", data: {loop: true}});
                program.control.stop.push({event: "global.plugin.audio.loop", data: {loop: false}});
            }
            program.control.start.push({event: "global.plugin.audio.open", data: {url: program.files.audio}});
            program.control.listen = 'promise.plugin.audio.stopped';
        }
    }
    init(type, main, event) {
        const that = this;
        this.main = main;
        this.event = event;
        this.sessions = new Set();
        if(type === 'console'){
            this.locked = false;
            this.$musicStart = $('<b></b>');
            this.$mic = $('<b class="mic"></b>');
            this.$songs = $(`<div class="songs-info indent-dl window-padding-all auto-scroll"></div>`);
            this.$song = $(`<div class="song-info"><dl></dl></div>`);
            this.$actor = $(`<div class="actor-info indent-dl window-padding-all auto-scroll"><dl></dl></div>`);
            this.$actorList = this.$actor.find('dl');
            this.$dt = $('<dt></dt>');
            this.$dd = $('<dd></dd>');
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
<th>音麦序</th>
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
                    {data: {_: "sort", display: "_id", filter: "_id"}, width: "30px", className: "nowrap text-right bold"},
                    {data: "session", "visible": false},
                    {data: 'program.clock', width: "3em", render: (data, type) => {
                        return type === 'display' ? Time.secondsToHMS(data) : data;
                    }},
                    {data: 'program.summary'},
                    {data: 'program.actor.unit', className: "nowrap", createdCell: (cell, unit, row) => {
                        const actor = row.program.actor;
                        if(isNonEmptyArray(actor.person) || isNonEmptyArray(actor.contacts) || isNonEmptyArray(actor.performers)) $(cell).wrapInner('<a href="javascript:" class="actor"></a>');
                        }},
                    {data: 'program.name', className: "nowrap", createdCell: (cell, name, row) => {
                            if(isNonEmptyArray(row.program.songs)) $(cell).wrapInner('<a href="javascript:" class="songs"></a>');
                        }},
                    {data: 'program.duration', width: "3em", render: (data, type) => {
                        return type === 'display' ? Time.secondsToMS(data) : data;
                    }},
                    {data: 'program.arrange.mic', className: "nowrap", searchable: false, orderable: false, render: RenderNothing, createdCell: (cell, mic, row) => {
                            const $cell = $(cell);
                            if(row.program.arrange.start) $cell.append(this.$musicStart.clone().text(`${row.program.arrange.start}`));
                            if(Array.isArray(mic)) mic.forEach((user, index) => {
                                if(user) $cell.append(this.$mic.clone().attr('title', user).text(String.fromCharCode(9312 + index)));
                            });
                        }},
                    {data: 'program.arrange.pa', orderable: false},
                    {data: 'program.arrange.remark', orderable: false},
                    {data: 'files', defaultContent: [], className: "nowrap", searchable: false, orderable: false, render: RenderNothing, createdCell: (cell, files) => {
                        if(!files) return;
                        const $cell = $(cell);
                        for(let type in files){
                            if(files.hasOwnProperty(type)) $cell.append($fileIcon.clone().addClass(`fa-${type} fa-file-${type}`).attr('title', files[type]));
                        }
                    }},
                    {data: 'control', defaultContent: {}, className: "nowrap", searchable: false, orderable: false, render: RenderNothing, createdCell: (cell, control) => {
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
                            this.event.emit("plugin.program.configure", program);
                        });
                        return programs;
                    },
                },
                buttons: [
                    {
                        text: '<i class="fa fa-fw fa-sync"></i>',
                        titleAttr: '同步',
                        className: 'btn btn-warning',
                        action: (e, dt) => {
                            this.locked = false;
                            dt.ajax.reload();
                        }
                    },
                    {
                        text: '<i class="fa fa-fw fa-unlock-alt"></i>',
                        titleAttr: '解锁',
                        className: 'btn btn-success',
                        action: () => {
                            this.unlock();
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
                    data.program.id = data._id;
                    $(row).addClass("program-entry").data("program", data.program);
                },
                dom: 'Bfrtip',
            }).on("click", ".btn-prepare", function(){
                that.prepare($(this));
            }).on("click", ".btn-execute", function(){
                that.execute($(this));
            }).on("click", "tr.program-entry", function(){
                if(!that.locked){
                    that.$table.find("tr.highlight").removeClass("highlight");
                    $(this).addClass("highlight");
                }
            });
            this.$manager.on("click", "a.songs", (ev) => {
                const songs = $(ev.currentTarget).closest('tr').data('program').songs;
                if(isNonEmptyArray(songs)){
                    this.$songs.empty();
                    songs.forEach(song => {
                        const $song = this.$song.clone(), $songItems = $song.find('dl');
                        Object.keys(SongFields).forEach(field => {
                            if(song[field]){
                                const addTitle = () => {
                                    $songItems.append(this.$dt.clone().text(SongFields[field]));
                                };
                                if(isNonEmptyArray(song[field])){
                                    addTitle();
                                    song[field].forEach(item => {
                                        $songItems.append(this.$dd.clone().text(item));
                                    });
                                }else if($.isPlainObject(song[field])){
                                    const languages = Object.keys(song[field]);
                                    if(languages.length){
                                        addTitle();
                                        languages.forEach(lang => {
                                            if(song[field][lang]) $songItems.append(this.$dd.clone().attr("lang", lang).text(song[field][lang]));
                                        });
                                    }
                                }
                            }
                        });
                        this.$songs.append($song);
                    });
                    main.openWindow('program-song-detail', {
                        theme:       'info',
                        headerTitle: '曲目详情',
                        position:    'center-top 0 30',
                        contentSize: '300 720',
                        content:     this.$songs.get(0)
                    });
                }
            });
            this.$manager.on("click", "a.actor", (ev) => {
                const actor = $(ev.currentTarget).closest('tr').data('program').actor;
                this.$actorList.empty();
                this.$actorList.append(this.$dt.clone().text('名称'), this.$dd.clone().text(actor.unit));
                Object.keys(ActorFields).forEach(field => {
                    if(isNonEmptyArray(actor[field])){
                        this.$actorList.append(this.$dt.clone().text(ActorFields[field]));
                        actor[field].forEach(item => {
                            this.$actorList.append(this.$dd.clone().text(item));
                        })
                    }
                });
                main.openWindow('program-actor-detail', {
                    theme:       'info',
                    headerTitle: '名义详情',
                    position:    'left-center 0 30',
                    contentSize: '300 400',
                    content:     this.$actor.get(0)
                });
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