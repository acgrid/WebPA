const webpack = require('webpack'),
     path = require('path');

let entry = {
    console: ['./src/console.js'],
    monitor: ['./src/monitor.js'],
};

if(process.env.NODE_ENV !== 'production'){
    for(let entryName in entry){
        entry[entryName].push('webpack-hot-middleware/client');
    }
}

module.exports = {
    entry,
    output: {
        path: path.resolve(__dirname, "public/js"),
        filename: '[name].js',
        publicPath: '/js',
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: function (module) {
                // this assumes your vendor imports exist in the node_modules directory
                return module.context && module.context.includes("node_modules");
            }
        }),
    ]
};