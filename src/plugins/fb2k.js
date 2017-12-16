const Plugin = require('./base'),
    Storage = require('../lib/storage'),
    $ = require('jquery');

module.exports = class FB2K extends Plugin{
    static name(){
        return 'fb2k';
    }

};