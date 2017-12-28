const webpack = require('webpack'),
    path = require('path'),
    plugins = [new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: function (module) {
            // this assumes your vendor imports exist in the node_modules directory
            return module.context && module.context.includes("node_modules");
        }
    }), new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
    })],
    entry = {app: ['./src/index.js']};

if(process.env.NODE_ENV !== 'production'){
    entry.app.push('webpack-hot-middleware/client');
    plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = {
    entry,
    output: {
        path: path.resolve(__dirname, "public/js"),
        filename: '[name].js',
        publicPath: '/js',
    },
    plugins
};