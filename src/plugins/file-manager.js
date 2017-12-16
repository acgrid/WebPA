const Plugin = require('./base'),
    $ = require('jquery');

module.exports = class FileManager extends Plugin{
    constructor(){
        super();
    }
    static name(){
        return 'file-manager';
    }
    init(type, main, event) {
        this.main = main;
        this.event = event;
        if(type === 'console'){
            this.$table = $(`
<div class="file-manager">
<p class="text-center"><button id="file-manager-refresh">刷新</button></p>
<table class="scroll">
<thead>
<tr><th>?</th><th>文件名</th><th>使用</th></tr>
</thead>
<tbody></tbody>
</table>
</div>`);
            this.$row = $(`<tr class="file-entry"><td><i class="fa fa-file fa-fw"></i></td><td></td><td></td></tr>`);
            this.$table.find('#file-manager-refresh').click(this.refresh.bind(this));
            this.$body = this.$table.find("tbody");
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-cube");
                    $icon.find("p").text("媒体库");
                    $icon.click(() => {
                        main.openWindow('file-manager', {
                            theme:       'info',
                            headerTitle: '媒体库',
                            position:    'center-top 0 30',
                            contentSize: '800 600',
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
            url: `/media/${this.main.channel}`,
            method: 'GET',
            cache: false,
            dataType: "json"
        }).then((data) => {
            if(data && data.prefix && data.files){
                const prefix = data.prefix;
                data.files.forEach((file) => {
                    const $row = this.$row.clone();
                    const extension = file.substr(file.lastIndexOf('.') + 1);
                    this.event.emit(`plugin.file.icon.${extension}`, $row.find("i"), extension);
                    $row.data("url", prefix + file);
                    $row.find("td:nth-child(2)").text(file);
                    this.event.emit(`plugin.file.operation.${extension}`, $row.find("td:last-child"), extension, file);
                    this.$body.append($row);
                });
            }else{
                this.event.emit("debug", `Bad file list: ${JSON.stringify(data)}`);
            }
        });
    }
};