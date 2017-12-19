const Plugin = require('./base'),
    $ = require('jquery');

class Locker extends Plugin{
    static name(){
        return 'locker';
    }
    init(type, main, event) {
        if(type === 'console'){
            this.locked = false;
            event.on("console.build", () => {
                main.createIcon(($icon) => {
                    const $i = $icon.find("i");
                    $i.addClass("lock-icon fa-lock-open");
                    $icon.find("p").text("锁定");
                    $icon.click(() => {
                        this.locked = !this.locked;
                        $i.toggleClass("fa-lock-open", !this.locked);
                        $i.toggleClass("fa-lock", this.locked);
                        this.execute($("body"));
                    });
                    return $icon;
                });
            });
            event.on("console.window.loaded", this.execute.bind(this));
            $(document).on('draw.dt', (e) => {
                this.execute($(e.target));
            });
        }
    }
    execute($container){
        $container.find(this.locked ? "button:not(:disabled)" : "button.locked:disabled").toggleClass("locked", this.locked).prop("disabled", this.locked);
    }
}

module.exports = Locker;