webpackJsonp([1],{

/***/ 4:
/***/ (function(module, exports, __webpack_require__) {

const wire = __webpack_require__(12)();
console.log('in local.js');
module.exports = wire;

/***/ }),

/***/ 64:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(65);
module.exports = __webpack_require__(26);


/***/ }),

/***/ 65:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__event_local__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__event_local___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__event_local__);


__WEBPACK_IMPORTED_MODULE_1__event_local___default.a.emit("bootstrap");

__WEBPACK_IMPORTED_MODULE_0_jquery___default()(function(){
    const v = document.getElementById('playback');
    const canvas = document.getElementById('overlay');
    const context = canvas.getContext('2d');

    canvas.width = v.clientWidth;
    canvas.height = v.clientHeight;
    context.strokeStyle = 'white';
    context.strokeRect(0, 0, v.clientWidth, v.clientHeight);
    context.strokeText('TEST3', 10, 10, 100);
});
__WEBPACK_IMPORTED_MODULE_1__event_local___default.a.emit("bootstrapped");

/***/ })

},[64]);