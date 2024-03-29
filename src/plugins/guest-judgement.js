const DOMPlugin = require('./dom'),
    eCharts = require('echarts/lib/echarts'),
    $ = require('jquery');

require('echarts/lib/chart/pie');

// TODO customize in the future
const ServiceUrl = 'https://www.comitime.com/wechat/app/judgement',
    ServiceKey = '6Wkt1hTSkOput2QSc7S9756u2LpMUMDdiztSrenU',
    MeterPercentWidth = 60,
    MeterPercentHeight = 80,
    TotalPhases = ['先锋', '次锋', '中坚', '副将', '大将'],
    Teams = {red: '红方', blue: '蓝方'};

const PrepareState = Symbol('prepare'),
    RunState = Symbol('run'),
    DoneState = Symbol('done'),
    ResultState = Symbol('result');

const $chart = $('<div class="chart"></div>');
const
    SANDBOX_JUDGE_PREPARE = 'sandbox.judge.prepare', // {prepare: 3, run: 30}
    SANDBOX_JUDGE_RUN = 'sandbox.judge.run',
    SANDBOX_JUDGE_DRAW = 'sandbox.judge.draw',
    SANDBOX_JUDGE_RESULT_SHOW = 'sandbox.judge.result.show',
    SANDBOX_JUDGE_RESULT_HIDE = 'sandbox.judge.result.hide',

    EVENT_GLOBAL_PREPARE = 'global.plugin.judge.prepare',
    EVENT_GLOBAL_RUN = 'global.plugin.judge.run',
    EVENT_GLOBAL_DONE = 'global.plugin.judge.done',
    EVENT_GLOBAL_RESULT_SHOW = 'global.plugin.judge.result.show',
    EVENT_GLOBAL_RESULT_HIDE = 'global.plugin.judge.result.hide';

module.exports = class PopularMeter extends DOMPlugin{
    constructor(){
        super('judgment');
        this.$dom = $(`
<div class="judgement-window full hidden">
<div class="pie-charts"></div>
<div class="progress">
    <div class="progress-bar progress-bar-danger red progress-bar-striped active" text-left></div>
    <div class="progress-bar progress-bar-primary blue progress-bar-striped active text-right"></div>
</div>
<div class="countdown"></div>
</div>        
`);
        this.$meter = this.$dom.find(".progress");
        this.$red = this.$dom.find(".red");
        this.$blue = this.$dom.find(".blue");
        this.$charts = this.$dom.find(".pie-charts");
        this.$countdown = this.$dom.find(".countdown");
        this.empty();
    }
    static name(){
        return 'judgement';
    }
    empty(){
        this.echarts = {};
        this.$charts.empty();
        TotalPhases.forEach((team, index) => {
            this.$charts.append($chart.clone().attr({"data-phase": index, "data-phase-name": team}).css("background-image", `url('/judge/${index}.png')`));
        });
    }
    createDOM(){
        return this.$dom;
    }
    resize(){
        const $sandbox = this.$dom.closest('.sandbox');
        this.width = $sandbox.width();
        this.height = $sandbox.height();
        const countDownHeight = this.height * 0.18 + "px";
        const percentHeight = this.height * 0.15 + "px";
        this.$countdown.css({width: this.width * 0.13 + "px", height: this.height * 0.2 + "px", "line-height": countDownHeight, "font-size": countDownHeight});
        this.$meter.css({height: percentHeight});
        this.$meter.find(".progress-bar").css({"font-size": this.height * 0.15 + "px", lineHeight: percentHeight});
    }
    myInit(type, main, event){
        this.event = event;
        this.main = main;
        this.activity = this.main.channel;
        this.phase = null;
        this.active = null;
        this.scores = {};
        this.state = null;
        // Global
        event.on(EVENT_GLOBAL_PREPARE, (data) => {
            this.state = PrepareState;
            event.emit(SANDBOX_JUDGE_PREPARE, data);
        });
        event.on(EVENT_GLOBAL_RUN, (data) => {
            this.state = RunState;
            event.emit(SANDBOX_JUDGE_RUN, data);
        });
        event.on(EVENT_GLOBAL_DONE, () => {
            this.state = DoneState;
        });
        event.on(EVENT_GLOBAL_RESULT_SHOW, (data) => {
            this.state = ResultState;
            event.emit(SANDBOX_JUDGE_RESULT_SHOW, data);
        });
        event.on(EVENT_GLOBAL_RESULT_HIDE, (data) => {
            this.state = null;
            event.emit(SANDBOX_JUDGE_RESULT_HIDE, data);
        });
        // Sandbox
        event.on(SANDBOX_JUDGE_PREPARE, (data) => {
            this.$dom.css("background-image", 'url("http://127.0.0.1:8080/mylive2017/JudgeRun.png")');
            this.resize();
            this.countdown(data.prepare);
            this.$dom.removeClass("hidden result");
            this.$meter.addClass("hidden");
        });
        event.on(SANDBOX_JUDGE_RUN, (data) => {
            this.countdown(data.run);
            this.$meter.removeClass("hidden");
        });
        event.on(SANDBOX_JUDGE_DRAW, (data) => {
            this.meter(data.percent.red);
        });
        event.on(SANDBOX_JUDGE_RESULT_SHOW, (data) => {
            this.$dom.css("background-image", 'url("http://127.0.0.1:8080/mylive2017/JudgeResult.png")').addClass("result");
            this.meter(data.totalRed);
            data.charts.forEach((chart, index) => {
                this.getEChart(index).setOption(chart);
            });
        });
        event.on(SANDBOX_JUDGE_RESULT_HIDE, (data) => {
            this.$dom.addClass("hidden");
        });
        if(type === 'console'){
            this.$control = $(`
<div class="judgement-manager">
<div class="row controls">
    <div class="col-lg-2"><input type="number" class="form-control" id="prepare-sec" value="3" placeholder="预备时长" min="0" step="1"></div>
    <div class="col-lg-2"><input type="number" class="form-control" id="run-sec" value="10" placeholder="投票时长" min="0" step="5"></div>
    <div class="col-lg-4">
        <button id="btn-run" class="btn btn-primary" title="开始"><i class="fa fa-play-circle"></i></button>
        <button id="btn-result" class="btn btn-info" title="结果" disabled><i class="fa fa-bullhorn"></i></button>
        <button id="btn-hide" class="btn btn-warning" title="隐藏" disabled><i class="fa fa-eye-slash"></i></button>
    </div>
    <div class="col-lg-4 text-right">
        <button class="btn btn-danger" title="前一阶段" data-cmd="prev"><i class="fa fa-backward"></i></button>
        <button class="btn btn-danger" title="后一阶段" data-cmd="next"><i class="fa fa-forward"></i></button>
        <button class="btn btn-danger" title="重置" data-cmd="reset"><i class="fa fa-trash"></i></button>
    </div>
</div>
<table class="table table-bordered table-responsive table-striped table-condensed table-hover">
<thead>
<tr><th>轮次</th></tr>
</thead>
<tbody></tbody>
</table>
</div>
            `);
            this.$tbody = this.$control.find("tbody");
            this.$row = $('<tr><td class="text-center"></td></tr>');
            this.$run = this.$control.find("#btn-run");
            this.$result = this.$control.find("#btn-result");
            this.$hide = this.$control.find("#btn-hide");
            this.$prepareSeconds = this.$control.find("#prepare-sec");
            this.$runSeconds = this.$control.find("#run-sec");
            let $headerRow = this.$control.find("thead > tr");
            for(let team in Teams){
                $headerRow.append($(`<th>${Teams[team]}</th>`));
                this.$row.append(`<td class="${team} text-right"></td>`);
            }
            this.$run.click(() => {
                const prepare = parseInt(this.$prepareSeconds.val()),
                    run = parseInt(this.$runSeconds.val());
                this.event.emit(EVENT_GLOBAL_PREPARE, {prepare, initial: true});
                setTimeout(() => {
                    if(this.state === PrepareState) this.event.emit(EVENT_GLOBAL_RUN, {run, initial: true});
                    setTimeout(() => {
                        if(this.state === RunState){
                            this.event.emit(EVENT_GLOBAL_DONE, {initial: true});
                        }
                    }, run * 1000);
                }, prepare * 1000);
            });
            this.$result.click(() => {
                const totalRed = this.percent('red');
                this.event.emit(EVENT_GLOBAL_RESULT_SHOW, {totalRed, charts: this.charts(), initial: true});
            });
            this.$hide.click(() => {
                this.event.emit(EVENT_GLOBAL_RESULT_HIDE, {initial: true});
            });
            this.$control.on("click", "button.btn-danger", (ev) => {
                const cmd = $(ev.currentTarget).data('cmd');
                if(!cmd || typeof this[cmd] !== 'function') return;
                this.main.confirm('确认操作?', () => {
                    this[cmd]().then(() => {
                        this.event.emit(`global.plugin.judge.${cmd}`);
                    });
                });
            });
            // SYNC
            event.on("plugin.judgement.sync.done", () => {
                this.$tbody.empty();
                for(let phase = 0; phase <= this.phase + 1; phase++){
                    let $row = this.$row.clone();
                    const total = phase > this.phase;
                    $row.find('td:first-child').text(total ? '合计' : (TotalPhases[phase] || phase + 1)).toggleClass("total", total).toggleClass('current', phase === this.phase);
                    for(let team in Teams) $row.find(`.${team}`).text(total ? this.sum(team) : this.query(team, phase));
                    this.$tbody.append($row);
                }
                if(this.state === RunState || this.state === DoneState){
                    this.event.emit(SANDBOX_JUDGE_DRAW, {percent: {red: this.phasePercent('red', this.phase)}, initial: true});
                }
            });
            // CONSOLE-ONLY EVENTS
            event.on(EVENT_GLOBAL_PREPARE, () => {
                this.$run.prop("disabled", true);
            });
            event.on(EVENT_GLOBAL_RUN, () => {
                this.on().then(() => {
                    this.$result.prop("disabled", true);
                    this.$hide.prop("disabled", true);
                }).catch(err => {
                    console.log(err);
                    this.main.alert('启动错误！');
                });
            });
            event.on(EVENT_GLOBAL_DONE, () => {
                this.off().then(() => {
                    this.$result.prop("disabled", false);
                }).catch(err => {
                    console.log(err);
                    this.main.alert('结束错误！');
                });
            });
            event.on(EVENT_GLOBAL_RESULT_SHOW, () => {
                this.$result.prop("disabled", true);
                this.$hide.prop("disabled", false);
            });
            event.on(EVENT_GLOBAL_RESULT_HIDE, () => {
                this.next().then(() => {
                    this.$hide.prop("disabled", true);
                    this.$run.prop("disabled", false);
                }).catch(err => {
                    console.log(err);
                    this.main.alert('下一阶段错误！');
                });
            });
            // UI
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-thermometer-half");
                    $icon.find("p").text("观众投票");
                    $icon.click(() => {
                        main.openWindow('judgement-control', {
                            theme:       'primary',
                            headerTitle: '观众投票',
                            position:    'center-top 0 30',
                            contentSize: '640 280',
                            content:     this.$control.get(0)
                        });
                    });
                    return $icon;
                });
            });
            event.on('plugin.preview.resize', this.resize.bind(this));
            // Polling
            event.on("console.started", () => {
                this.sync();
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
    meter(redPercent){
        const bluePercent = 100 - redPercent;
        const redText = `${redPercent}%`;
        const blueText = `${bluePercent}%`;
        this.$red.css("width", redText).text(redText);
        this.$blue.css("width", blueText).text(blueText);
    }
    countdown(left){
        if(left <= 0) return;
        this.$countdown.text(left).removeClass("hidden");
        const ct = setInterval(() => {
            if(left > 0){
                this.$countdown.text(--left);
            }else{
                clearInterval(ct);
            }
        }, 1000);
    }
    request(cmd, data = {}){
        return new Promise((resolve, reject) => {
            data.key = ServiceKey;
            $.post({
                url: `${ServiceUrl}/${cmd}/${this.activity}`,
                method: "POST",
                cache: false,
                data,
                dataType: "json",
            }).then(data => {
                if(data){
                    resolve(data);
                }else{
                    reject(typeof data);
                }
            }).catch(err => {
                reject(err);
            });
        });
    }
    data(data){
        this.active = data.active;
        this.phase = data.phase;
        this.scores = data.scores;
        this.event.emit("plugin.judgement.sync.done", this.active, this.phase, this.scores);
    }
    sync(){
        this.request('stat').then(this.data.bind(this));
    }
    query(team, phase){
        return this.scores[team] && this.scores[team][phase] ? this.scores[team][phase] : 0;
    }
    sum(team){
        return Array.isArray(this.scores[team]) ? this.scores[team].reduce((sum, value) => sum + value, 0) : 0;
    }
    getEChart(phase){
        if(!this.echarts[phase]){
            this.echarts[phase] = eCharts.init(this.$charts.find(`.chart[data-phase=${phase}]`).get(0));
        }
        return this.echarts[phase];
    }
    charts(){
        const charts = [];
        for(let phase = 0; phase <= this.phase; phase++){
            charts.push({
                series: {
                    type: "pie",
                    radius: '80%',
                    data: this.round(phase),
                    label: {
                        normal: {
                            show: true,
                            position: 'inside',
                            formatter: '{d}%',
                            color: 'white',
                            fontSize: "20"
                        }
                    },
                },
                stillShowZeroSum: false,
                animationDuration: 2000,
                animationDelay: 500 * phase
            });
        }
        return charts;
    }
    round(phase){
        const data = [];
        for(let team in Teams){
            data.push({value: this.query(team, phase), name: Teams[team], itemStyle: {normal: {color: team}, emphasis: {color: team}}});
        }
        return data;
    }
    percent(team){
        let total = 0, thisTeam, myTeam;
        for(let currTeam in Teams){
            thisTeam = this.sum(currTeam);
            total += thisTeam;
            if(currTeam === team) myTeam = thisTeam;
        }
        return total ? Math.round(myTeam / total * 100) : 50;
    }
    phasePercent(team, phase){
        let total = 0, thisTeam, myTeam;
        for(let currTeam in Teams){
            thisTeam = this.query(currTeam, phase);
            total += thisTeam;
            if(currTeam === team) myTeam = thisTeam;
        }
        return total ? Math.round(myTeam / total * 100) : 50;
    }
    on(){
        return new Promise((resolve, reject) => {
            this.request('active').then((data) => {
                this.data(data);
                this.event.emit("plugin.judgement.on");
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }
    off(){
        return new Promise((resolve, reject) => {
            this.request('deactive').then((data) => {
                this.data(data);
                this.event.emit("plugin.judgement.off");
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }
    prev(){
        return new Promise((resolve, reject) => {
            if(this.phase === 0){
                resolve(0);
            }else{
                this.request('prev').then(data => {
                    this.data(data);
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }
        });
    }
    next(){
        return new Promise((resolve, reject) => {
            if(this.phase && this.phase >= TotalPhases.length - 1){
                resolve(this.phase);
            }else{
                this.request('next').then(data => {
                    this.data(data);
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }
        });
    }
    reset(){
        return new Promise((resolve, reject) => {
            this.request('reset').then(() => {
                this.phase = 0;
                this.active = false;
                this.scores = {};
                for(let index in this.echarts){
                    this.echarts[index].dispose();
                    delete this.echarts[index];
                }
                this.empty();
                this.event.emit("plugin.judgement.reset", this.active, this.phase, this.scores);
                this.event.emit("plugin.judgement.sync.done", this.active, this.phase, this.scores);
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }
};