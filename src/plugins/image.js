const DOM = require('./dom'),
    $ = require('jquery'),
    Storage = require('../lib/storage');

const
    EVENT_GLOBAL_UPDATE = "global.plugin.images.update", // with presets
    EVENT_SANDBOX_UPDATE = "sandbox.images.update",
    
    STORAGE_PRESETS = "plugin.images.presets";

const FileType = /png|jpe?g|gif/i;

class MultiImage extends DOM{
    static name(){
        return 'image';
    }
    constructor(){
        super('image');
        this.$dom = $(`<div class="full images"></div>`);
    }
    createDOM(){
        return this.$dom;
    }
    myInit(type, main, event){
        this.event = event;
        event.on(EVENT_SANDBOX_UPDATE, (data) => {
            this.$dom.css("background", data.bg ? data.bg : "transparent");
        });
        if(type === 'console'){
            this.presets = Storage.get(STORAGE_PRESETS, {});
            this.$controls = $(`
<div class="window-padding-all">
<div class="row">
    <div class="col-lg-8">
        <div class="input-group">
            <input type="text" class="form-control" name="preset" placeholder="预设名" />
            <span class="input-group-btn"><button type="button" class="btn btn-success save" title="保存"><i class="fa fa-save"></i></button></span>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="input-group">
            <div class="input-group-btn">
                <button class="btn btn-default dropdown-toggle" data-toggle="dropdown" style="width: 100%;">预设 <span class="caret"></span></button>
                <ul class="dropdown-menu"></ul>
            </div>
            <span class="input-group-btn"><button type="button" class="btn btn-danger delete" title="删除"><i class="fa fa-trash"></i></button></span>
        </div>
    </div>
</div>
<p></p>
<p><textarea rows="3" class="form-control" placeholder="eg: url('/1.jpg') right bottom no-repeat, url('/2.jpg') left right no-repeat"></textarea></p>
<div class="text-center">
    <div class="btn-group text-center" role="group">
        <button type="button" class="btn btn-danger apply" title="应用"><i class="fa fa-play"></i></button>
        <button type="button" class="btn btn-default cancel" title="取消"><i class="fa fa-eye-slash"></i></button>
    </div>
</div>
</div>
`);
            this.$preset = $('<li><a href="javascript:"></a></li>');
            this.$select = this.$controls.find("ul");
            this.$editor = this.$controls.find("textarea");
            this.$apply = this.$controls.find('.apply');
            this.$cancel = this.$controls.find('.cancel');
            this.$name = this.$controls.find('[name=preset]');
            this.$save = this.$controls.find('.save');
            this.$delete = this.$controls.find('.delete');
            this.$select.on("click", "a", (ev) => {
                const selected = $(ev.currentTarget).text();
                this.$name.val(selected);
                if(this.presets[selected]) event.emit(EVENT_GLOBAL_UPDATE, {bg: this.presets[selected], from: "preset"});
            });
            this.$save.click(() => {
                const name = this.$name.val(), value = this.$editor.val();
                if(name && value){
                    this.presets[name] = value;
                    this.save();
                }
            });
            this.$delete.click(() => {
                const name = this.$name.val();
                if(name && this.presets[name]){
                    delete this.presets[name];
                    this.save();
                }
            });
            this.$apply.click(() => {
                event.emit(EVENT_GLOBAL_UPDATE, {bg: this.$editor.val(), from: "editor"});
            });
            this.$cancel.click(() => {
                event.emit(EVENT_GLOBAL_UPDATE, {bg: "transparent", from: "reset"});
            });
            event.on(EVENT_GLOBAL_UPDATE, (data) => {
                if(data.from !== 'editor') this.$editor.val(data.bg);
                data.initial = true;
                event.emit(EVENT_SANDBOX_UPDATE, data);
            });
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-images");
                    $icon.find("p").text("图片组");
                    $icon.click(() => {
                        main.openWindow('images-setup', {
                            theme:       'primary',
                            headerTitle: '图片组',
                            position:    'center-top 0 50',
                            contentSize: '640 180',
                            content:     this.$controls.get(0)
                        });
                    });
                    return $icon;
                });
                this.load();
            });
            event.on("enter", (params) => {
                //if(params.role === 'monitor') this.set(this.bg, false);
            });
            //this.set(this.bg);
        }
    }
    set(bg, initial = true){
        this.event.emit(EVENT_GLOBAL_UPDATE, {bg, initial});
    }
    load(){
        this.$select.empty();
        for(let key in this.presets){
            if(this.presets.hasOwnProperty(key)) this.$select.append(this.$preset.clone().find("a").text(key).end());
        }
    }
    save(){
        Storage.set(STORAGE_PRESETS, this.presets);
        this.load();
    }
}

module.exports = MultiImage;