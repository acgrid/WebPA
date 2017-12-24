function join(...params){
    return params.map(param => {
        return param >= 0 && param < 10 ? `0${param}` : param;
    }).join(':');
}
module.exports = {
    secondsToMS(seconds){
        seconds = parseInt(seconds);
        if(isNaN(seconds)) return '-';
        return join(Math.floor(seconds / 60), seconds % 60);
    },
    secondsToHMS(seconds){
        seconds = parseInt(seconds);
        if(isNaN(seconds)) return '-';
        return join(Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60);
    },
    msToSeconds(ms){
        const time = ms.split(':');
        if(time.length !== 2) return 0;
        return parseInt(time[0], 10) * 60 + parseInt(time[1], 10);
    }
};