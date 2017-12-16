module.exports = {
    secondsToMS(seconds){
        seconds = parseInt(seconds);
        if(isNaN(seconds)) return '-';
        return `${Math.floor(seconds / 60)}:${seconds % 60}`;
    },
    msToSeconds(ms){
        const time = ms.split(':');
        if(time.length !== 2) return 0;
        return parseInt(time[0], 10) * 60 + parseInt(time[1], 10);
    }
};