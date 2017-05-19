function getMousePosition(e){
    var touches = e['touches'];
    if(touches && touches.length > 0){
        e = touches[0];
    }
    var pageX = e.pageX || e.clientX,
        pageY = e.pageY || e.clientY;
    return {
        pageX:pageX,
        pageY:pageY
    };
}
function isDomElement(object) {

    if(!object){
        return false;
    }
    var tagName = object.tagName;
    if(!tagName){
        return false;
    }
    var ele = document.createElement(tagName);
    if(ele.__proto__){
        return ele.__proto__ === object.__proto__;
    }
    return Object.keys(ele).every(function (key) {
        return object['hasOwnProperty'](key);
    });

}
function isTouchSupported(){

    return document['ontouchstart'] !== undefined;

}
var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(executor){
            return setTimeout(executor,1000/60);
        },
    cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.clearTimeout;

var _timeoutCache = {};
function executeFunctionDelay(timeoutId,func,context) {

    if(typeof func !== 'function'){
        return;
    }
    context = context || this;
    cancelAnimationFrame(_timeoutCache[timeoutId]);
    return _timeoutCache[timeoutId] = requestAnimationFrame(func.bind(context));

};
function isElementInDom(element){
    return document.contains(element);
}
export { isElementInDom,isTouchSupported,getMousePosition,isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay }