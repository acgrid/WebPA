const DOMPlugin = require('./dom'),
    $ = require('jquery');

const PrepareState = Symbol('prepare'),
    RunState = Symbol('run'),
    ResultState = Symbol('result');

const
    EVENT_SANDBOX_SHOW = 'sandbox.shake-roll.show',
    EVENT_SANDBOX_START = 'sandbox.shake-roll.start',
    EVENT_SANDBOX_UPDATE = 'sandbox.shake-roll.update',
    EVENT_SANDBOX_RESULT = 'sandbox.shake-roll.result',
    EVENT_SANDBOX_HIDE = 'sandbox.shake-roll.hide',

    PROMISE_ROLL_HIDDEN = 'promise.plugin.shake-roll.hidden'
;

const PROGRAM = 'Z01';

class ShakeRoller extends DOMPlugin{
    constructor(shake){
        super('shake-roll');
        this.state = null;
        this.shake = shake;
        this.$dom = $('<div class="shake-roll-overlay full hidden"><div class="shakers"></div><div class="result"></div></div>');
        this.$shakers = this.$dom.find(".shakers");
        this.$result = this.$dom.find(".result");
        this.$shaker = $('<img src="" alt="" class="animated zoomIn img-rounded" />');
        this.$shakerMap = {};
    }
    static name(){
        return 'shake-roll';
    }
    createDOM(){
        return this.$dom;
    }
    resize(){
        const $sandbox = this.$dom.closest('.sandbox');
        this.width = $sandbox.width();
        this.height = $sandbox.height();
        const fontSize = this.height * 0.05 + "px";
        this.$dom.css({"line-height": fontSize, "font-size": fontSize});
    }
    myInit(type, main, event) {
        this.event = event;
        this.main = main;
        // Sandbox
        event.on(EVENT_SANDBOX_SHOW, () => {
            this.resize();
            this.$shakerMap = {};
            this.$result.text('准备开始！');
            this.$shakers.empty();
            this.$dom.removeClass("hidden");
        });
        event.on(EVENT_SANDBOX_START, (data) => {
            this.sync();
            this.countdown(data.run);
        });
        event.on(EVENT_SANDBOX_UPDATE, (data) => {
            const shakers = data.shakers, sidList = Object.keys(shakers);
            sidList.forEach(sid => {
                if(this.$shakerMap.hasOwnProperty(sid)){
                    this.$shakerMap[sid].css("opacity", shakers[sid]);
                }else{
                    const $shaker = this.$shaker.clone().attr({src: `https://www.comitime.com/wechat/app/avatar/${sid}`});
                    this.$shakerMap[sid] = $shaker;
                    this.$shakers.append($shaker);
                }
                this.adjustWidth(sidList.length);
                Object.keys(this.$shakerMap).filter(sid => {
                    return sidList.indexOf(sid) === -1;
                }).forEach(oldSid => {
                    this.$shakerMap[oldSid].remove();
                    delete this.$shakerMap[oldSid];
                });
            });
        });
        event.on(EVENT_SANDBOX_RESULT, (data) => {
            const sid = data.sid;
            if(sid) this.$shakerMap[sid].addClass("selected").css("opacity", 1);
            this.$result.text(sid || '');
        });
        event.on(EVENT_SANDBOX_HIDE, () => {
            this.$dom.addClass("hidden");
            event.emit(PROMISE_ROLL_HIDDEN);
        });
        // Console
        if(type === 'console') {
            this.shakers = null;
            this.$control = $(`
<div class="shake-roll-manager">
<div class="row controls">
    <div class="col-lg-3"><input type="number" class="form-control" id="run-sec" value="10" placeholder="准备时长" min="0" step="5"></div>
    <div class="col-lg-9">
        <button id="btn-show" class="btn btn-success" title="显示"><i class="fa fa-eye"></i></button>
        <button id="btn-run" class="btn btn-primary" title="开始" disabled><i class="fa fa-play-circle"></i></button>
        <button id="btn-hide" class="btn btn-warning" title="隐藏" disabled><i class="fa fa-eye-slash"></i></button>
    </div>
</div>
<table class="table table-bordered table-responsive table-striped table-condensed table-hover">
<thead>
<tr><th>SID</th><th>透明度(0-1)</th></tr>
</thead>
<tbody></tbody>
</table>
</div>`);
            this.$runSeconds = this.$control.find("#run-sec");
            this.$show = this.$control.find("#btn-show");
            this.$run = this.$control.find("#btn-run");
            this.$hide = this.$control.find("#btn-hide");
            this.$table = this.$control.find("table");
            this.$table.data("DataTableOptions", {
                order: [[1, 'asc']],
                columnDefs: [
                    {targets: 0, className: "wechat-sid"},
                ]
            });
            this.handle = null;
            // DOM & Logic
            this.$show.click(() => {
                this.state = PrepareState;
                this.$show.prop("disabled", true);
                this.$run.prop("disabled", false);
                event.emit(EVENT_SANDBOX_SHOW, {initial: true});
            });
            this.$run.click(() => {
                const run = parseInt(this.$runSeconds.val());
                this.state = RunState;
                this.$run.prop("disabled", true);
                this.shake.request(`set/${PROGRAM}`).then(() => {
                    this.event.emit(EVENT_SANDBOX_START, {initial: true, run});
                    setTimeout(() => {
                        if(this.state === RunState){
                            this.shake.request('unset').then(() => {
                                // Find lucky guy
                                this.state = ResultState;
                                this.$hide.prop("disabled", false);
                                event.emit(EVENT_SANDBOX_RESULT, {initial: true, sid: this.find()});
                            });
                        }
                    }, run * 1000);
                });
            });
            this.$hide.click(() => {
                this.state = null;
                this.$show.prop("disabled", false);
                this.$hide.prop("disabled", true);
                event.emit(EVENT_SANDBOX_HIDE, {initial: true});
            });
            // REGISTER
            event.on("global.plugin.shake-roll.on", (data) => {
                this.open();
            });
            // UI
            event.on('plugin.preview.resize', this.resize.bind(this));
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-handshake");
                    $icon.find("p").text("摇一摇抽奖");
                    $icon.click(() => {
                        this.open();
                    });
                    return $icon;
                });
            });
            event.on("console.started", () => {
                setInterval(() => {
                    if(this.state === RunState){
                        this.sync();
                        this.event.emit("plugin.judge.tick");
                    }
                }, 1000);
                $(window).resize(this.resize.bind(this));
            });
        }
    }
    open(){
        this.main.openWindow('roll-control', {
            theme:       'primary',
            headerTitle: '摇一摇抽奖',
            position:    'center-top 0 30',
            contentSize: '480 600',
            content:     this.$control.get(0)
        });
    }
    countdown(left){
        if(left <= 0) return;
        this.$result.text(left).removeClass("hidden");
        const ct = setInterval(() => {
            if(left > 0){
                this.$result.text(--left);
            }else{
                clearInterval(ct);
            }
        }, 1000);
    }
    sync(){
        this.shake.request(`recent/${PROGRAM}`).then(shakers => {
            this.shakers = shakers;
            this.event.emit(EVENT_SANDBOX_UPDATE, {initial: true, shakers});
            const dt = this.$table.DataTable();
            dt.clear();
            Object.keys(shakers).forEach(sid => {
                dt.row.add([sid, shakers[sid]]);
            });
            dt.draw(false);
        });
    }
    find(){
        if($.isPlainObject(this.shakers)){
            let currentSid = null, currentRecent = 0;
            Object.keys(this.shakers).forEach((sid) => {
                const recent = this.shakers[sid];
                if(recent > currentRecent){
                    currentSid = sid;
                    currentRecent = recent;
                }
            });
            return currentSid;
        }
        return null;
    }
    adjustWidth(length){
        const quantity = Math.min(30, Math.max(10, Math.pow(Math.ceil(Math.sqrt(length)), 2)));
        console.log(quantity);
        this.$dom.find("img").css("width", (100 / quantity) + '%');
    }
}

module.exports = ShakeRoller;