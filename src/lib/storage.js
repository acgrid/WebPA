module.exports = {
    set(key, value){
        localStorage.setItem(key, JSON.stringify(value));
    },
    get(key, defaults){
        let value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaults;
    },
    clear(key){
        localStorage.removeItem(key);
    }
};