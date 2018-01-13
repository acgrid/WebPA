const api = require('../lib/api.js'),
    commandLineArgs = require('command-line-args'),
    media = require('../lib/media'),
    debug = require('debug')('sync:audit');

const args = commandLineArgs([
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'activities', type: String, multiple: true, defaultOption: true }
]);

if(Array.isArray(args['activities'])) args['activities'].forEach(activity => {
    debug(`Fetch programs list of '${activity}'`);
    api(`live/programs/${activity}`).then((programs) => {
        if(Array.isArray(programs)){
            debug(`${programs.length} programs to be checked`);
            programs.forEach(programId => {
                api(`live/program/${programId}/audit`).then(audit => {
                    if(audit['abandon']) return;
                    if(audit['url'] && !audit['extension']){
                        const url = audit['url'];
                        if(/pan\.baidu\.com/i.test(url)){
                            console.log(`Please manually download for ${programId} from ${url}`)
                        }else{
                            debug(`Try download audit data for ${programId} from ${url}`);
                            media.scrape(activity, url, (err, stdout, stderr) => {
                                if(err){
                                    throw err;
                                }else{
                                    console.log(stdout);
                                }
                            });
                        }
                    }
                });
            });
        }
    }).catch((err) => {
        console.warn(err);
    });
});

