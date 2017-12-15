const io = require('socket.io');
const CONSOLE = 'console';
const debug = require('debug')('webpa:socket');

class Channels{
    constructor(){
        this.channels = {};
        this.sockets = new WeakMap();
    }
    channel(channel, role){
        if(!this.channels[channel]) this.channels[channel] = {};
        if(!this.channels[channel][role]) this.channels[channel][role] = new Set();
        return this.channels[channel][role];
    }
    add(channel, role, socket){
        this.channel(channel, role).add(socket);
        this.sockets.set(socket, {channel, role});
        return this;
    }
    remove(channel, role, socket){
        this.channel(channel, role).delete(socket);
        this.sockets.delete(socket);
        return this;
    }
}

module.exports = (http) => {
    const channels = new Channels();
    const server = io(http);

    server.on('connection', function(socket) {
        let myChannel, myRole;
        const toConsole = (event, transport = {}) => {
            if(!myChannel) return;
            if(!transport['src']) transport['src'] = socket.id;
            socket.to(`${myChannel}.${CONSOLE}`).emit(event, transport);
        }, toRole = (role, event, transport = {}) => {
            if(!myChannel) return;
            socket.to(`${myChannel}.${role}`).emit(event, transport);
        }, leave = () => {
            if(myChannel && myRole){
                channels.remove(myChannel, myRole, socket);
                if(myRole !== CONSOLE) toConsole('common', {name: 'exit'});
                debug(`${socket.id} left ${myChannel} as ${myRole}.`);
                myChannel = null;
                myRole = null;
            }
        }, enter = (channel, role) => {
            myChannel = channel;
            myRole = role;
            channels.add(channel, role, socket);
            if(myRole !== CONSOLE) toConsole('common', {name: 'enter', channel, role});
            debug(`${socket.id} entered ${channel} as ${role}.`);
        };
        socket.on('enter', (transport, ack) => {
            const {channel, role} = transport;
            socket.join(`${channel}.${role}`, (err) => {
                ack(err ? err : enter(channel, role));
            });
        });
        socket.on('exit', (ack) => {
            if(myChannel && myRole){
                socket.leave(`${myChannel}.${myRole}`, (err) => {
                    ack(err ? err : leave());
                });
            }
        });
        socket.on('disconnect', function() {
            leave();
        });
        socket.on('env', function(transport) {
            if(myRole !== CONSOLE) toConsole('env', transport);
        });
        socket.on('sandbox', function(transport) {
            if(myRole === CONSOLE) toRole('monitor', 'sandbox', transport);
        });
        socket.on('monitor', function(transport){
            if(myRole === 'monitor') toConsole('monitor', transport);
        });
        socket.on('console', function(transport){
            if(myRole === CONSOLE) toConsole('console', transport);
        });
        socket.on("ping", function(){
            toConsole('common', {name: 'heartbeat', role: myRole});
        });
    });
    return server;
};