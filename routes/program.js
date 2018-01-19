const express = require('express'),
    config = require('config'),
    router = express.Router();

/* Program */
router.get('/:channel', function(req, res) {
    const server = config.get('program'), channel = req.params['channel'] || "default",
        request = require('request-promise-native'), fs = require('fs'), path = require('path'), api = require('../lib/api');
    const cacheFile = path.join(__dirname, 'public', 'cache', `${channel}.json`), cacheUrl = `/cache/${channel}.json`;
    const debug = require('debug')('webpa:program');
    const saveCache = (data, cb) => {
        if(data) fs.writeFile(cacheFile, data, cb);
        res.set('Content-Type', 'application/json');
        res.send(data);
    };
    const requestStorage = () => {
        request({
            url: `${server.url}program/${channel}`,
            method: "GET",
            headers: {"Authorization": server.key}
        }).then((data) => {
            saveCache(data, () => {
                debug(`Fetch remote programs data and cached to ${cacheFile}`);
            });
        }).catch((err) => {
            debug('Failed to fetch remote programs', err);
            fs.access(cacheFile, fs.constants.R_OK, (err) => {
                if(err){
                    debug('No local cache found', err);
                    res.json([]);
                }else{
                    debug(`Found local cache ${cacheFile}, redirect to it`);
                    res.redirect(302, cacheUrl);
                }
            });
        });
    };
    const requestAPI = () => {
        api(`live/pa/${channel}.json`).then(data => {
            if(data === null){
                requestStorage();
            }else{
                saveCache(data, () => {
                    debug(`Fetch API programs data and cached to ${cacheFile}`);
                });
            }
        }).catch(err => {
            debug('Failed to fetch API programs', err);
            requestStorage();
        });
    };
    if(req.app.get('env') !== 'production'){
        fs.access(cacheFile, fs.constants.R_OK, (err) => {
            if(err){
                debug('No local cache found', err);
                requestAPI();
            }else{
                debug('Bypass remote call for debug!');
                debug(`Found local cache ${cacheFile}, redirect to it`);
                res.redirect(302, cacheUrl);
            }
        });
    }else{
        requestAPI();
    }
});

module.exports = router;