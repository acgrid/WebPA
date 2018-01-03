const Plugin = require('./base'),
    Storage = require('../lib/storage'),
    Sortable = require('sortablejs'),
    $ = require('jquery');

class Reorder extends Plugin{
    static name(){
        return 'reorder';
    }
    init(type, main, event){
        this.event = event;
        if(type === 'console'){
            this.$control = $('<div class="reorder"><ol class="list-group"></ol><p class="text-center"><button class="btn btn-primary">恢复默认</button></p></div>');
            this.$entry = $('<li class="list-group-item"></li>');
            this.$list = this.$control.find('ol');
            this.$control.find("button").click(() => {
                this.event.emit('sandbox.layers.restore', {initial: true});
                this.event.emit('global.plugin.reorder.update', {initial: true, local: true});
            });
            event.on('global.plugin.reorder.update', (data) => {
                if(data.local || !data.initial) this.loadOrder();
            });
            event.on("console.started", () => {
                const preview = main.plugin('preview');
                if(preview){
                    this.loadOrder();
                    event.on('console.window.show.layer-reorder', this.loadOrder.bind(this));
                }else{
                    throw new Error('Can not reorder without preview plugin');
                }

            });
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    $icon.find("i").addClass("fa-eye");
                    $icon.find("p").text("覆盖顺序");
                    $icon.click(() => {
                        main.openWindow('layer-reorder', this.setupWindow.bind(this));
                    });
                    return $icon;
                });
            });
        }
    }
    updateOrder(){
        this.$list.children().toArray().reverse().forEach((layer, index) => {
            layer = layer.getAttribute('data-id');
            this.event.emit('sandbox.layers.set', {layer, index, initial: true});
            this.event.emit('global.plugin.reorder.update', {initial: true});
        });
    }
    loadOrder(){
        const order = [];
        this.event.emit('sandbox.layers.get', order);
        order.reverse();
        if(this.sortable){
            this.sortable.sort(order);
        }else{
            order.forEach((layer) => {
                this.$list.append(this.$entry.clone().text(layer).attr('data-id', layer));
            });
            this.sortable = Sortable.create(this.$list.get(0), {
                ghostClass: 'ghost',
                onUpdate: this.updateOrder.bind(this)
            });
        }
    }
    setupWindow(){
        return {
            theme:       'primary',
            headerTitle: '覆盖顺序',
            position:    'center-top 0 150',
            contentSize: '200 320',
            content:     this.$control.get(0)
        };
    }

}

module.exports = Reorder;