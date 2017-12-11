const webpack = require('webpack'),
     path = require('path');

let entry = {
        console: ['./src/console.js'],
        monitor: ['./src/monitor.js'],
    };

if(process.env.NODE_ENV !== 'production'){
    for(let item in entry){
        entry[item].push('webpack-hot-middleware/client');
    }
}

module.exports = {
    entry,
    output: {
        path: path.resolve(__dirname, "public/js"),
        filename: '[name].bundle.js',
        publicPath: '/js',
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
};