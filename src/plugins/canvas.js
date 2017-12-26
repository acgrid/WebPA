const DOM = require('./dom');

module.exports = class Canvas extends DOM{
    static name(){
        return 'canvas';
    }
    initCanvas(width, height){
        if(!this.canvas) return;
        this.canvas.width = parseInt(width, 10);
        this.canvas.height = parseInt(height, 10);
        if(this.event) this.event.emit("debug", `Canvas size ${width}*${height}`);
    }
    x(x){
        x = parseFloat(x);
        return x > 0 && x <= 100 ? x * this.canvas.width / 100 : x;
    }
    y(y){
        y = parseFloat(y);
        return y > 0 && y <= 100 ? y * this.canvas.height / 100 : y;
    }
};