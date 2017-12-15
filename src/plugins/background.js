const DOM = require('./dom');

module.exports = class Background extends DOM{
    constructor(html){
        super();
    }
    static name(){
        return 'background';
    }
};