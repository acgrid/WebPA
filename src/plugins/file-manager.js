const Plugin = require('./base');

module.exports = class FileManager extends Plugin{
    constructor(){
        super();
    }
    static name(){
        return 'file';
    }
};