const express = require('express'),
    path = require('path'),
    config = require('config'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    lessMiddleware = require('less-middleware');

const app = express();

let isDev = app.get('env') !== 'production';
let allowedIPs = config.get("allowed_ips");

if (isDev) {
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');
    const config = require('./webpack.config.js');
    const compiler = webpack(config);

    app.use(webpackHotMiddleware(compiler));
    app.use(webpackDevMiddleware(compiler, {
        noInfo: !isDev,
        publicPath: config.output.publicPath,
    }));
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(function(req, res, next){
    req.debug = isDev;
    next();
});
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public'), {render: {paths: [path.join(__dirname, 'node_modules')]}}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/light', require('./routes/light'));
app.use(function(req, res, next){
    if(allowedIPs.indexOf(req.ip) === -1){
        res.status(403).send("Forbidden").end();
    }
    next();
});
app.use('/console', require('./routes/console'));
app.use('/monitor', require('./routes/monitor'));
app.use('/fb2k', require('./routes/fb2k'));
app.use('/program/', require('./routes/program'));
app.use('/media/:channel', (req, res) => {
    const http = config.get('media').http, channel = req.param('channel', 'default');
    require('./lib/media').list(channel).then((files) => {
        res.json({prefix: `${http.scheme}://${req.hostname}:${http.port}${http.path}${channel}/`, files});
    }).catch((err) => {
        const debug = require('debug')('webpa:media');
        debug(err);
        res.json([]);
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
