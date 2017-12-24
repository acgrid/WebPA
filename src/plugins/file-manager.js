const Plugin = require('./base'),
    $ = require('jquery');

require('../lib/datatable');

/**
 *
 * @param data
 * @param type
 * @returns {string}
 */
function RenderNothing(data, type){
    return type === 'display' ? '' : data;
}

module.exports = class FileManager extends Plugin{
    static name(){
        return 'file-manager';
    }
    buildFileList(json){
        if(json && json.prefix && json.files){
            return this.files = json.files.map((file) => {
                return {
                    file,
                    url: json.prefix + file,
                    extension: file.substr(file.lastIndexOf('.') + 1)
                };
            });
        }else{
            this.event.emit("debug", `Bad file list: ${JSON.stringify(json)}`);
            return [];
        }
    }
    init(type, main, event) {
        this.main = main;
        this.event = event;
        this.mediaListUrl = `/media/${this.main.channel}`;
        this.files = [];
        if(type === 'console'){
            this.$table = $(`
<div class="file-manager window-padding-top">
<table class="table table-bordered table-responsive table-striped table-condensed table-hover scroll">
<thead>
<tr><th><i class="fa fa-file fa-fw"></i></th><th>文件名</th><th>操作</th></tr>
</thead>
<tbody></tbody>
</table>
</div>`);
            this.$icon = $('<i class="fa fa-file fa-fw"></i>');
            this.$table.find("table").data("DataTableOptions", {
                order: [[1, 'asc']],
                ajax: {
                    url: this.mediaListUrl,
                    cache: false,
                    dataSrc: this.buildFileList.bind(this)
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
                columns: [
                    {data: 'extension', searchable: false, render: RenderNothing, createdCell: (cell, data) => {
                        const $icon = this.$icon.clone();
                        this.event.emit(`plugin.file.icon.${data}`, $icon, data);
                        $(cell).append($icon);
                    }},
                    {data: 'file'},
                    {data: null, searchable: false, orderable: false, render: RenderNothing, createdCell: (cell, data, row) => {
                        const $cell = $(cell);
                        this.event.emit(`plugin.file.operation.${row.extension}`, $cell, row.extension, row.file);
                    }}
                ],
                createdRow: (row, data) => {
                    $(row).addClass("file-entry").data("url", data.url);
                },
                dom: 'Bfrtip',
            });
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-cube");
                    $icon.find("p").text("媒体库");
                    $icon.click(() => {
                        this.open();
                    });
                    return $icon;
                });
            });
            event.on("plugin.media.require.files", () => {
                if(this.files.length) return;
                this.event.emit("debug", "Preload file list as somebody required!");
                $.getJSON(this.mediaListUrl, this.buildFileList.bind(this));
            });
            event.on("plugin.media.match", (regexp, callback) => {
                let matchedFiles = this.files.filter(entry => {
                    return regexp.test(entry.file);
                });
                if(matchedFiles.length) callback(matchedFiles);
            });
        }
    }
    open(status){
        this.main.openWindow('file-manager', {
            theme:       'info',
            headerTitle: '媒体库',
            position:    'center-top 0 30',
            contentSize: '800 600',
            content:     this.$table.get(0),
            setStatus:   status
        });
    }
};