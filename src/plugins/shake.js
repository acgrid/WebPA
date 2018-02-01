const DOMPlugin = require('./dom'),
    $ = require('jquery');

const ServiceUrl = 'https://www.comitime.com/wechat/app/shake',
    ServiceKey = '6Wkt1hTSkOput2QSc7S9756u2LpMUMDdiztSrenU';

const
    SANDBOX_SHAKE_ON = 'sandbox.shake.on',
    SANDBOX_SHAKE_UPDATE = 'sandbox.shake.update',
    SANDBOX_SHAKE_OFF = 'sandbox.shake.off';

const
    PROGRAM_TYPES = ['A', 'C', 'D', 'I', 'Z'];

class Shake extends DOMPlugin{
    constructor(){
        super('shake');
        this.$dom = $('<div class="shake-overlay hidden clearfix">Lv.<b>1</b><progress max="100"></progress></div>');
        this.$progress = this.$dom.find("progress");
        this.$level = this.$dom.find('b');
    }
    static name(){
        return 'shake';
    }
    createDOM(){
        return this.$dom;
    }
    myInit(type, main, event) {
        this.event = event;
        this.main = main;
        this.counters = {};
        this.program = null;
        event.on(SANDBOX_SHAKE_ON, () => {
            this.$progress.prop("value", 0);
            this.$level.text("1");
            this.$dom.removeClass("hidden");
        });
        event.on(SANDBOX_SHAKE_UPDATE, (data) => {
            const highest = this.$progress.prop("max");
            if(data.total > highest){
                this.$progress.prop("max", data.total * 2);
                this.$level.text(parseInt(this.$level.text()) + 1);
            }
            this.$progress.prop("value", data.total || 0);
        });
        event.on(SANDBOX_SHAKE_OFF, () => {
            this.$dom.addClass("hidden");
        });
        if(type === 'console'){
            setInterval(this.update.bind(this), 1000);
            event.on('plugin.program.execute', (program) => {
                if(program.id && PROGRAM_TYPES.indexOf(program.id.slice(0, 1)) !== -1){
                    this.program = program.id;
                    this.selfUpdate = this.program !== 'Z';
                    this.request(`set/${this.program}`).then(() => {
                        if(this.selfUpdate) this.event.emit(SANDBOX_SHAKE_ON, {initial: true});
                    });
                }
            });
            event.on('plugin.program.finish', () => {
                if(this.program){
                    this.program = null;
                    if(this.selfUpdate) this.event.emit(SANDBOX_SHAKE_OFF, {initial: true});
                }
                this.request('unset');
            });
        }
    }
    request(cmd, data = {}){
        return new Promise((resolve, reject) => {
            data.key = ServiceKey;
            $.post({
                url: `${ServiceUrl}/${cmd}`,
                method: "POST",
                cache: false,
                data,
                dataType: "json",
            }).then(data => {
                resolve(data);
            }).catch(err => {
                err.status === 202 ? resolve(null) : reject(err);
            });
        });
    }
    update(){
        if(this.program && this.selfUpdate) this.request(`counter/${this.program}`).then((counter) => {
            this.counters[this.program] = counter;
            this.event.emit(SANDBOX_SHAKE_UPDATE, {initial: true, total: counter});
        });
    }
}

module.exports = Shake;