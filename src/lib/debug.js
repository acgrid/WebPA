const ev = require('./local');
const registeredModules = {};
if(window){
    window.debugModules = registeredModules;
}

ev.after("module.register", function(module){
    if(module && module.name && module.object)
        registeredModules[module.name] = module.object;
});
module.exports = registeredModules;