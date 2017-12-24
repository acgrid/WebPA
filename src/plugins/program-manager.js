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

module.exports = class ProgramManager extends Plugin{
    static name(){
        return 'program-manager';
    }
    init(type, main, event) {
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
<th><i class="fa fa-cogs"></i></th>
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
                    {data: null, searchable: false, orderable: false, render: RenderNothing, createdCell: (cell, data, row) => {
                        const $cell = $(cell);
                        this.event.emit(`plugin.program.operation`, $cell, row);
                    }}
                ],
                ajax: {
                    url: `/program/${this.main.channel}`,
                    dataSrc: (programs) => {
                        this.programs = programs;
                        programs.forEach(program => {
                            this.sessions.add(program.session);
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
            });
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
                            content:     this.$manager.get(0)
                        });
                    });
                    return $icon;
                });
            });
            event.on("console.started", () => {
                //this.refresh();
            });
        }
    }
};