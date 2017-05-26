import { global } from './../config/Config';
function getMousePosition(e,referElement){
    var touches = e['touches'];
    if(touches && touches.length > 0){
        e = touches[0];
    }
    var pageX = e.pageX || e.clientX,
        pageY = e.pageY || e.clientY;

    if(isDomElement(referElement)){
        var bound = referElement.getBoundingClientRect();
        pageY = pageY - bound.top,
        pageX = pageX - bound.left;
    }
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
function getFullClassName(className) {

    var themesPrefix = global.config.themesPrefix;
    if(!className){
        return themesPrefix;
    }
    return themesPrefix + '-' + className;

};
function getFullClassSelector(selector) {

    return '.' + getFullClassName(selector);

};
var browseCssPrefixes = ['-webkit-','-moz-','-ms-'];
Object.freeze(browseCssPrefixes);
var cssPropNames = ['transform','transition','animate'];
function style(ele,style){
    if(arguments.length === 3){
        ele.style[style] = arguments[2];
        return;
    }
    Object.keys(style).forEach(function (key) {
        if(cssPropNames.indexOf(key) >= 0){
            browseCssPrefixes.forEach(function (prefix) {
                ele.style[prefix + key] = style[key];
            });
        }
        ele.style[key] = style[key];
    });
}
function userSelect(selected,ele){
    ele = ele || document.body;
    ele.setAttribute('user_select',String(selected));
}

export { browseCssPrefixes,style,userSelect,getFullClassName,getFullClassSelector,isElementInDom,isTouchSupported,getMousePosition,isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay }