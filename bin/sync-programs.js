const api = require('../lib/api.js'),
    commandLineArgs = require('command-line-args'),
    media = require('../lib/media'),
    debug = require('debug')('sync:programs');

const args = commandLineArgs([
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'activities', type: String, multiple: true, defaultOption: true }
]);

if(Array.isArray(args['activities'])) args['activities'].forEach(activity => {
    media.hash(activity, null, (file, hash) => {
        debug(`Hashed ${hash} => ${file}`);
    }).then(hashMap => {
        const syncFile = (programId, fileType, meta) => {
            if(meta[fileType]){
                debug(`Assuming file ${fileType} of ${programId}`);
                api(`live/program/${programId}/${fileType}`).then(file => {
                    if(file && typeof file === 'object' && file['source_url'] && file['sha']){
                        const sha1 = file['sha'];
                        const newFileName = `${meta._id} ${meta.name}.${meta[fileType]}`.replace(/[|\\\/:<>!?*]/g, "_");
                        if(hashMap.hasOwnProperty(sha1)){
                            const oldFileName = hashMap[sha1];
                            debug(`Found identical ${fileType} file ${sha1} of ${programId}`);
                            if(oldFileName === newFileName){
                                debug(`Skip renaming for ${oldFileName} for its name remains ${sha1}`);
                            }else{
                                debug(`Rename from ${oldFileName} to ${newFileName}`);
                                media.rename(activity, oldFileName, newFileName, (err) => {
                                    err ? console.warn(err) : debug(`Renaming success for ${newFileName}`);
                                });
                            }
                        }else{
                            debug(`Download new ${fileType} file ${sha1} of ${programId}`);
                            media.download(activity, file['source_url'], newFileName, (err) => {
                                err ? console.warn(err) : debug(`Download success as ${newFileName}`);
                            });
                        }
                    }else{
                        debug(`No ${fileType} file found of ${programId}`);
                    }
                });
            }
        };
        debug(`Fetch programs list of '${activity}'`);
        api(`live/programs/${activity}`).then((programs) => {
            if(Array.isArray(programs)){
                debug(`${programs.length} programs to be checked`);
                programs.forEach(programId => {
                    api(`live/program/${programId}/meta`).then(meta => {
                        syncFile(programId, 'audio', meta);
                        syncFile(programId, 'video', meta);
                        syncFile(programId, 'image', meta);
                        syncFile(programId, 'lyric', meta);
                    });
                });
            }
        }).catch((err) => {
            console.warn(err);
        });
    });
});

