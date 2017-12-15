const DOMPlugin = require('./dom');

module.exports = class VideoPlayer extends DOMPlugin{
    static name(){
        return 'video';
    }
};