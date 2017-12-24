module.exports = {
    channel(channel){
        switch(typeof channel){
            case 'string':
                this.prefix = channel + '.';
                break;
            case 'undefined':
                return this.prefix || '';
            default:
        }
    },
    set(key, value){
        key = this.channel() + key;
        localStorage.setItem(key, JSON.stringify(value));
    },
    get(key, defaults){
        key = this.channel() + key;
        let value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaults;
    },
    clear(key){
        key = this.channel() + key;
        localStorage.removeItem(key);
    }
};