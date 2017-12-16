const express = require('express'),
    router = express.Router(),
    debug = require('debug')('webpa:fb2k'),
    fb2k = require('../lib/fb2k');

const onSuccess = function(data) {
    data.ok = true;
    this.json(data);
},
    onError = function(err) {
        debug('FB2K Error', err);
        this.json(null);
    };

/* FB2K */
router.get('/', function(req, res) {
    fb2k.info().then(onSuccess.bind(res)).catch(onError.bind(res));
});
router.post('/play', function(req, res) {
    const list = req.body.list, track = req.body.track;
    if(typeof list === 'string' && typeof track === 'string'){
        debug(`FB2K Play List ${list + 1} Track ${track + 1}`);
        fb2k.play(list, track).then(onSuccess.bind(res)).catch(onError.bind(res));
    }else{
        res.end();
    }
});
router.post('/pause', function(req, res) {
    debug(`FB2K Pause`);
    fb2k.pause().then(onSuccess.bind(res)).catch(onError.bind(res));
});
router.post('/stop', function(req, res) {
    debug(`FB2K Stop`);
    fb2k.stop().then(onSuccess.bind(res)).catch(onError.bind(res));
});
router.post('/seek', function(req, res) {
    const position = req.body.position;
    if(typeof position === 'string'){
        debug(`FB2K Seeking ${position}`);
        fb2k.seek(position).then(onSuccess.bind(res)).catch(onError.bind(res));
    }else{
        debug(req.body);
        res.end();
    }
});
router.post('/volume', function(req, res) {
    const volume = req.body.volume;
    if(typeof volume === 'string'){
        debug(`FB2K Volume ${volume}`);
        fb2k.volume(volume).then(onSuccess.bind(res)).catch(onError.bind(res));
    }else{
        res.end();
    }
});

module.exports = router;