const CanvasPlugin = require('./canvas');

module.exports = class PopularMeter extends CanvasPlugin{
    constructor(canvas){
        super();
    }
    static name(){
        return 'popular-meter';
    }
};