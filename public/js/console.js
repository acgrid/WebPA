webpackJsonp([0],{

/***/ 28:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(29);
module.exports = __webpack_require__(26);


/***/ }),

/***/ 29:
/***/ (function(module, exports, __webpack_require__) {

const $ = __webpack_require__(11),
    ev = __webpack_require__(4),
    ws = __webpack_require__(34);
__webpack_require__(55)($);
ev.on("sandbox", function(packet){
    ws.emit("sandbox", packet, (ack) => {
        console.log(ack);
    });
});
ev.emit("bootstrap");
ev.on("ws.beforeConnect", function(socket){
    console.log(socket.id);
});

/***/ }),

/***/ 34:
/***/ (function(module, exports, __webpack_require__) {

const io = __webpack_require__(35),
    event = __webpack_require__(4);
module.exports = class RemoteEvent{
    constructor(options = {}){
        options.autoConnect = false;
        this.socket = io(location.protocol + '//' + location.host, options);
        event.emit("ws.beforeConnect", this.socket);
        this.socket.open();
    }

};

/***/ }),

/***/ 4:
/***/ (function(module, exports, __webpack_require__) {

const wire = __webpack_require__(12)();
console.log('in local.js');
module.exports = wire;

/***/ }),

/***/ 52:
/***/ (function(module, exports) {

/* (ignored) */

/***/ })

},[28]);