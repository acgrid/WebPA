const DOMPlugin = require('./dom'),
    $ = require('jquery');

const Interval = 100;

const
    EVENT_GLOBAL_IMPORT = 'global.plugin.roll.import',
    EVENT_GLOBAL_START = 'global.plugin.roll.start',
    EVENT_GLOBAL_RANDOM = 'global.plugin.roll.random',
    EVENT_GLOBAL_SELECT = 'global.plugin.roll.select',
    EVENT_GLOBAL_TOGGLE = 'global.plugin.roll.toggle',
    EVENT_GLOBAL_END = 'global.plugin.roll.end',

    EVENT_SANDBOX_SHOW = 'sandbox.roll.show',
    EVENT_SANDBOX_UPDATE = 'sandbox.roll.update',
    EVENT_SANDBOX_HIDE = 'sandbox.roll.hide',

    PROMISE_ROLL_HIDDEN = 'promise.plugin.roll.hidden'
;

class Roller extends DOMPlugin{
    constructor(){
        super('roll');
        this.$dom = $('<div class="roll-overlay hidden"></div>');
    }
    static name(){
        return 'roll';
    }
    createDOM(){
        return this.$dom;
    }
    resize(){
        const $sandbox = this.$dom.closest('.sandbox');
        this.width = $sandbox.width();
        this.height = $sandbox.height();
        const fontSize = this.height * 0.2 + "px";
        this.$dom.css({"line-height": fontSize, "font-size": fontSize});
    }
    myInit(type, main, event) {
        this.event = event;
        this.main = main;
        // Global
        event.on(EVENT_GLOBAL_IMPORT, (data) => {
            this.source = data.array;
        });
        event.on(EVENT_GLOBAL_START, (data) => {
            event.emit(EVENT_SANDBOX_SHOW, data);
        });
        event.on(EVENT_GLOBAL_RANDOM, (data) => {
            this.current = data.random;
            event.emit(EVENT_SANDBOX_UPDATE, data);
        });
        event.on(EVENT_GLOBAL_SELECT, () => {
            this.source.splice(this.source.indexOf(this.current), 1); // remove from source
        });
        event.on(EVENT_GLOBAL_END, (data) => {
            event.emit(EVENT_SANDBOX_HIDE, data);
        });
        event.on(EVENT_SANDBOX_SHOW, () => {
            this.resize();
            this.$dom.removeClass("hidden");
        });
        event.on(EVENT_SANDBOX_UPDATE, (data) => {
            this.$dom.text(data.random);
        });
        event.on(EVENT_SANDBOX_HIDE, () => {
            this.$dom.addClass("hidden");
            event.emit(PROMISE_ROLL_HIDDEN);
        });
        // Console
        if(type === 'console') {
            this.$control = $(`
<div class="roll-manager">
<div class="row controls">
    <div class="col-lg-12">
        <div class="input-group">
        <span class="input-group-addon">列表</span>
        <input type="url" id="roll-url" placeholder="Text URL" class="form-control" />
        <span class="input-group-btn"><button class="btn btn-success" id="load-url">获取</button></span>
        </div>
    </div>
</div>
<div class="row controls">
    <div class="col-lg-12">
        <div class="input-group">
            <span class="input-group-addon">序列</span>
            <input type="number" id="roll-start" placeholder="起始值" value="1" min="0" step="1" class="form-control" />
            <span class="input-group-addon">-</span>
            <input type="number" id="roll-end" placeholder="结束值" value="50" min="0" step="1" class="form-control" />
            <span class="input-group-btn"><button class="btn btn-success" id="load-sequence">生成</button></span>
        </div>
    </div>
</div>
<div class="row controls">
    <div class="col-lg-4 text-center"><button id="btn-run" class="btn btn-primary" title="开始" disabled><i class="fa fa-eye"></i></button></div>
    <div class="col-lg-4 text-center"><button id="btn-hit" class="btn btn-info" title="抽选" disabled><i class="fa fa-pause"></i></button></div>
    <div class="col-lg-4 text-center"><button id="btn-hide" class="btn btn-warning" title="隐藏" disabled><i class="fa fa-eye-slash"></i></button></div>
</div>
<table class="table table-bordered table-responsive table-striped table-condensed table-hover scroll">
<thead>
<tr><th>序号</th><th>结果</th></tr>
</thead>
<tbody></tbody>
</table>
</div>`);
            this.$table = this.$control.find("table");
            this.$table.data("DataTableOptions", {
                order: [[0, 'asc']],
                columnDefs: [
                    {targets: 0, className: "poll-key"},
                ]
            });
            this.$url = this.$control.find('#roll-url');
            this.$start = this.$control.find('#roll-start');
            this.$end = this.$control.find('#roll-end');
            this.$loadUrl = this.$control.find('#load-url');
            this.$loadSequence = this.$control.find('#load-sequence');
            this.$run = this.$control.find('#btn-run');
            this.$hit = this.$control.find('#btn-hit');
            this.$hide = this.$control.find('#btn-hide');
            this.handle = null;
            // DOM
            this.$loadUrl.click(() => {
                this.loadUrl(this.$url.val());
            });
            this.$loadSequence.click(() => {
                this.loadSequence(parseInt(this.$start.val()), parseInt(this.$end.val()));
            });
            this.$run.click(() => {
                if(!this.source.length){
                    this.main.alert('已经抽完');
                    return;
                }
                event.emit(EVENT_GLOBAL_START, {initial: true});
            });
            this.$hit.click(() => {
                if(!this.source.length){
                    this.main.alert('已经抽完');
                    return;
                }
                event.emit(EVENT_GLOBAL_TOGGLE, {initial: true});
            });
            this.$hide.click(() => {
                event.emit(EVENT_GLOBAL_END, {initial: true});
            });
            // GLOBAL
            event.on(EVENT_GLOBAL_IMPORT, (data) => {
                this.$run.prop("disabled", !Array.isArray(data.array) || !data.array.length);
            });
            event.on(EVENT_GLOBAL_START, () => {
                this.$run.prop("disabled", true);
                this.$hit.prop("disabled", false);
                this.$run.prop("disabled", true);
                this.toggle();
            });
            event.on(EVENT_GLOBAL_TOGGLE, () => {
                const rolling = this.toggle();
                this.$hit.find("i").removeClass(rolling ? "fa-play" : "fa-pause").addClass(rolling ? "fa-pause" : "fa-play");
                this.$hide.prop("disabled", rolling);
                if(!rolling){
                    this.event.emit(EVENT_GLOBAL_SELECT);
                    const dt = this.$table.DataTable();
                    dt.cell($("td.poll-key").filter((index, elem) => {
                        return elem.innerText === this.current.toString();
                    }), 1).data((new Date()).toLocaleTimeString()).draw(false);
                }
            });
            event.on(EVENT_GLOBAL_END, () => {
                this.$run.prop("disabled", false);
                this.$hit.prop("disabled", true);
                this.$hide.prop("disabled", true);
            });
            // REGISTER
            event.on("global.plugin.roll.url", (data) => {
                this.open();
                setTimeout(() => {
                    this.$url.val(data.url);
                    this.$loadUrl.click();
                });
            });
            event.on("plugin.program.file.select", (files, selected) => {
                for(let file of files){
                    if(/txt|json/i.test(file.extension) && file.file.indexOf('ROLL') !== -1){
                        selected.random = file.url;
                        return;
                    }
                }
            });
            // UI
            event.on('plugin.preview.resize', this.resize.bind(this));
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-random");
                    $icon.find("p").text("抽奖");
                    $icon.click(() => {
                        this.open();
                    });
                    return $icon;
                });
            });
        }
    }
    open(){
        this.main.openWindow('roll-control', {
            theme:       'primary',
            headerTitle: '观众抽奖',
            position:    'center-top 0 30',
            contentSize: '480 600',
            content:     this.$control.get(0)
        });
    }
    toggle(){
        if(this.handle){
            clearInterval(this.handle);
            this.handle = null;
            return false;
        }else{
            this.handle = setInterval(() => {
                this.event.emit(EVENT_GLOBAL_RANDOM, {initial: true, random: this.random()});
            }, Interval);
            return true;
        }
    }
    import(array){
        const dt = this.$table.DataTable();
        dt.clear();
        array.forEach(item => {
            dt.row.add([item, '']);
        });
        dt.draw(false);
        this.event.emit(EVENT_GLOBAL_IMPORT, {initial: true, array});
    }
    loadUrl(url){
        if(!url){
            this.main.alert("URL为空！");
            return;
        }
        $.ajax({
            url,
            cache: false,
            dataType: url.substr(url.lastIndexOf('.') + 1) === 'json' ? 'json' : "text"
        }).done(data => {
            if(Array.isArray(data)){
                this.import(data);
            }else if(typeof data === 'string'){
                this.import(data.split("\n").map(line => {
                    return line.trim();
                }).filter(line => {
                    return line.length > 0 && line.indexOf('#') !== 0;
                }));
            }else{
                console.log(data);
                this.main.alert('未知数据');
            }
        }).fail((jqXHR, textStatus, errorThrown) => {
            console.log(textStatus, errorThrown);
            this.main.alert('读取失败');
        });
    }
    loadSequence(start, end){
        if(isNaN(start) || isNaN(end) || start < 0 || start > end){
            this.main.alert('数值错误');
            return;
        }
        const array = [];
        for(let i = start; i <= end; i++) array.push(i);
        this.import(array);
    }
    random(){
        if(Array.isArray(this.source)){
            return this.source[Math.floor(Math.random() * this.source.length)];
        }
    }
}

module.exports = Roller;