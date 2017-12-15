const Plugin = require('./base');

module.exports = class ProgramManager extends Plugin{
    constructor(fb2k, videoPlayer){
        super();
    }
    static name(){
        return 'programs';
    }
};