(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
   typeof define === 'function' && define.amd ? define(['exports'], factory) :
   (factory((global.HERE = global.HERE || {}, global.HERE.UI = global.HERE.UI || {}, global.HERE.UI.CELL = global.HERE.UI.CELL || {})));
}(this, (function (exports) { 'use strict';

var _config = {
    themesPrefix : 'd1012'
};
var global = {};
Object.defineProperty(global,'config',{

    get : function () {
        return _config;
    },
    set : function (config) {
        Object.assign(_config,config);
    }

});

if(!Object.assign){
    Object.assign = function (src,target) {
        if(!target){
            return src;
        }
        Object.keys(target).forEach(function (key) {
            src[key] = target[key];
        });
        return src;
    };
}
function Class(){

}
var __instanceId__ = 1;
Class.create = function (baseClass) {
    var base = new Class();
    var _initHooks = [];
    var clazz = function () {

        Object.defineProperty(this,'_id',{
            value:'_instance_' + (__instanceId__++)
        });

        var args = arguments;
        if(typeof baseClass === 'function'){
            baseClass.apply(this,args);
        }else{
            Object.keys(baseClass).forEach(function (key) {
                this[key] = baseClass[key];
            }.bind(this));
        }
        _initHooks.forEach(function (initHook) {
            try{
                initHook.apply(this,args);
            }catch(e){
                console.log(e.stack || e);
            }
        }.bind(this));
    };
    clazz.addInitHooks = function (initHook) {

        var index = _initHooks.indexOf(initHook);
        if(index === -1){
            _initHooks.push(initHook);
        }

    };
    clazz.removeInitHooks = function (initHook) {

        var index = _initHooks.indexOf(initHook);
        if(index >= 0){
            _initHooks.splice(index,1);
        }

    };
    clazz.extend = function(extend,override){
        var _prototype = clazz.prototype;
        if(override === undefined || override === null){
            override = true;
        }
        Object.keys(extend).forEach(function(key){
            if(!override && (key in _prototype)){
                return;
            }
            _prototype[key] = extend[key];
        });
    };
    clazz.prototype = base;
    return clazz;
};

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
        };
var cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.clearTimeout;

var _timeoutCache = {};
function executeFunctionDelay(timeoutId,func,context) {

    if(typeof func !== 'function'){
        return;
    }
    context = context || this;
    cancelAnimationFrame(_timeoutCache[timeoutId]);
    return _timeoutCache[timeoutId] = requestAnimationFrame(func.bind(context));

}
function executeFunctionTimeout(timeoutId,func,timeout,context) {

    if(typeof func !== 'function'){
        return;
    }
    context = context || this;
    clearTimeout(_timeoutCache[timeoutId]);
    return _timeoutCache[timeoutId] = setTimeout.call(window,func.bind(context),timeout);

}
function isElementInDom(element){
    return document.contains(element);
}
function getFullClassName(className) {

    var themesPrefix = global.config.themesPrefix;
    if(!className){
        return themesPrefix;
    }
    return themesPrefix + '-' + className;

}
function getFullClassSelector(selector) {

    return '.' + getFullClassName(selector);

}
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

function ScrollConfig(config){
    this.scrollX = true;
    this.scrollY = true;
    this.autoHideX = true;
    this.autoHideY = true;
    this.width = 12;
    this.height = 12;
    this.hTrackColor = '';
    this.hScrollColor = '';
    this.vTrackColor = '';
    this.vScrollColor = '';
    this.timeout = 1300;
    if(config){
        Object.assign(this,config);
    }
}
ScrollConfig.defaultConfig = function () {
    return new ScrollConfig()
};

var ScrollBar = Class.create(function (ele,config) {
    this.init(ele,config);
});
ScrollBar.mouseupListeners = null;
ScrollBar.mousemoveListeners = null;
ScrollBar.initEventListeners = function () {
    if(!ScrollBar.mouseupListeners){
        ScrollBar.mouseupListeners = {};
        ScrollBar.mousemoveListeners = {};
        document.body.addEventListener('mouseup', function (evt) {
            var _ = this;
            Object.keys(ScrollBar.mouseupListeners).forEach(function (key) {
                var listener = ScrollBar.mouseupListeners[key];
                try{
                    listener.call(_,evt);
                }catch(e){}
            });
        },true);

        document.body.addEventListener('mousemove', function (evt) {
            var _ = this;
            Object.keys(ScrollBar.mousemoveListeners).forEach(function (key) {
                var listener = ScrollBar.mousemoveListeners[key];
                try{
                    listener.call(_,evt);
                }catch(e){}
            });
        },true);
    }
};
function getWidth(ele){
    var style$$1 = window.getComputedStyle(ele);
    var value = 0;
    ['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth','width'].forEach(function (key) {
        value += (parseFloat(style$$1[key]) || 0);
    });
    return value;
}
function getClientWidth(ele){
    return ele.clientWidth;
}
function isAbsolute(el){
    var position = window.getComputedStyle(el).position;
    return ['fixed','absolute'].indexOf(position) >= 0;
}
function getScrollWidth(element){
    var children = element.children;
    var length = children.length,width = 0,ele;
    var sizes = [],w = 0;
    if(length > 0){
        for(var i = 0;i < length;i++){
            ele = children[i];
            if(ele.vScrollbar || ele.hScrollbar){
                continue;
            }
            w = Math.max(ele.scrollWidth,ele.offsetWidth);
            sizes.push(w);
            if(isAbsolute(ele)){
                continue;
            }
            width += w;
        }
    }
    sizes.forEach(function(size){
        width = Math.max(width,size);
    });
    return Math.max(element.scrollWidth,element.clientWidth,width);
}
function getHeight(ele){
    var style$$1 = window.getComputedStyle(ele);
    var value = 0;
    ['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth','height'].forEach(function (key) {
        value += (parseFloat(style$$1[key]) || 0);
    });
    return value;
}
function getClientHeight(ele){
    return ele.clientHeight;
}
function getScrollHeight(element){
    var children = element.children;
    var length = children.length,height = 0,ele;
    var sizes = [],h = 0;
    if(length > 0){
        for(var i = 0;i < length;i++){
            ele = children[i];
            if(ele.vScrollbar || ele.hScrollbar){
                continue;
            }
            h = Math.max(ele.scrollHeight,ele.offsetHeight);
            sizes.push(h);
            if(isAbsolute(ele)){
                continue;
            }
            height += h;
        }
    }
    sizes.forEach(function(size){
        height = Math.max(height,size);
    });
    return Math.max(element.scrollHeight,element.clientHeight,height);
}
ScrollBar.prototype.init = function (ele,config) {

    this.element = ele;
    this._scrollWidth = 0;
    this.clientWidth = 0;
    this._scrollHeight = 0;
    this.clientHeight = 0;


    this._scrollTop = 0;
    this._scrollLeft = 0;
    var _ = this;
    Object.defineProperty(this,'scrollTop',{
        set: function (val) {
            _.scrollTopTo(val);
        },
        get: function () {
            return _.scrollTopTo();
        }
    });
    Object.defineProperty(this,'scrollLeft',{
        set: function (val) {
            _.scrollLeftTo(val);
        },
        get: function () {
            return _.scrollLeftTo();
        }
    });
    Object.defineProperty(this,'scrollWidth',{
        set: function (val) {
            _._setScrollWidth(val);
        },
        get: function () {
            return _._getScrollWidth();
        }
    });
    Object.defineProperty(this,'scrollHeight',{
        set: function (val) {
            _._setScrollHeight(val);
        },
        get: function () {
            return _._getScrollHeight();
        }
    });
    this.overflowX = false;
    this.overflowY = false;
    this.config = Object.assign(ScrollConfig.defaultConfig(),config);

    this.initScrollSize(['width','height']);

    this.eventListeners = {};

    this.vScrollbar = null;
    this.hScrollbar = null;

    ScrollBar.initEventListeners();

    this.initUI();

};
ScrollBar.prototype.initScrollSize = function (types) {
    if(!(types instanceof Array)){
        types = [].concat(types);
    }
    types.forEach(function (type) {
        var size = this.config[type];
        if(!size){
            return;
        }
        size = parseFloat(size);
        if(isNaN(size)){
            delete this.config[type];
            console.error(new Error('scroll ' + type + ' is invalid !'));
        }
        this.config[type] = size;
    }.bind(this));

};
ScrollBar.prototype.initUI = function () {

    style(this.element,{
        overflow:'hidden'
    });

    this._renderV();
    this._renderH();
    this.syncScrollbarSize();

    this._bindScrollEvent();

};
ScrollBar.prototype.syncScrollbarSize = function () {

    executeFunctionDelay(this._id + 'syncScrollSize', function () {

        var width = Math.max(getWidth(this.vScrollbar),this.vScrollbar.offsetWidth);
        this.config.width = Math.max(width,this.config.width);

        var height = Math.max(getHeight(this.hScrollbar),this.hScrollbar.offsetHeight);
        this.config.height = Math.max(height,this.config.height);

    },this);

};
ScrollBar.prototype.triggerScrollEvent = function () {

    this._toggleVisible();

    var scrollEvtKey = this._id + 'scroll';
    executeFunctionDelay(scrollEvtKey, function () {
        this.triggerEvent('scroll',{
            scrollLeft:this.scrollLeft,
            scrollTop:this.scrollTop
        });
    },this);

};
ScrollBar.prototype.resize = function () {

    this.updateScrollSize();
    var bar;
    if(this.hScrollbar){
        bar = this.hScrollbar.children[0];
        var barWidth = this.getScrollbarWidth();
        style(bar,{
            width:barWidth + 'px'
        });

        style(this.hScrollbar,{
            display:this.isScrollX() ? 'block' : 'none'
        });
    }

    if(this.vScrollbar){
        bar = this.vScrollbar.children[0];
        var barHeight = this.getScrollbarHeight();
        style(bar,{
            height:barHeight + 'px'
        });

        style(this.vScrollbar,{
            display:this.isScrollY() ? 'block' : 'none'
        });
    }


    this.refresh();
};
ScrollBar.prototype.refresh = function () {

    this.scrollLeft = this.scrollLeft;
    this.scrollTop = this.scrollTop;

};
ScrollBar.prototype.updateScrollSize = function () {

    var clientWidth = getClientWidth(this.element),scrollWidth = getScrollWidth(this.element);

    var clientHeight = getClientHeight(this.element),scrollHeight = getScrollHeight(this.element);

    this.overflowX = scrollWidth > clientWidth;
    this.overflowY = scrollHeight > clientHeight;

    this.clientWidth = clientWidth;
    this.clientHeight = clientHeight;
    this.scrollWidth = scrollWidth;
    this.scrollHeight = scrollHeight;

};
ScrollBar.prototype._setScrollWidth = function (scrollWidth) {

    this._scrollWidth = scrollWidth;

};
ScrollBar.prototype.isScrollY = function () {
    return this.config.scrollY && this.overflowY;
};
ScrollBar.prototype.isScrollX = function () {
    return this.config.scrollX && this.overflowX;
};
ScrollBar.prototype._getScrollWidth = function () {

    var scrollWidth = this._scrollWidth;
    return scrollWidth;

};
ScrollBar.prototype._setScrollHeight = function (scrollHeight) {

    this._scrollHeight = scrollHeight;

};
ScrollBar.prototype._getScrollHeight = function () {

    var scrollHeight = this._scrollHeight;
    return scrollHeight;

};
ScrollBar.prototype._createScrollBarBlock = function () {

    var bar = document.createElement('div');
    bar.className = getFullClassName('scrollbar-block');
    return bar;

};
ScrollBar.prototype._renderH = function () {

    var dom = document.createElement('div');
    dom.hScrollbar = true;
    dom.setAttribute('hidden-scroll','');
    this.hScrollbar = dom;
    dom.className = getFullClassName('scrollbar-hor');
    style(dom,{
        height:this.config.height + 'px',
        right:this.config.width + 'px',
        display:'none',
        'background-color':this.config.hTrackColor
    });

    var bar = this._createScrollBarBlock();
    style(bar,{
        'background-color':this.config.hScrollColor
    });

    dom.appendChild(bar);
    this.element.appendChild(dom);

};
ScrollBar.prototype.addEventListener = function (eventType,listener) {

    var listeners = this.eventListeners[eventType];
    if(!listeners){
        listeners = this.eventListeners[eventType] = [];
    }
    listeners.push(listener);

};
ScrollBar.prototype.triggerEvent = function (eventType,e) {

    var listeners = this.eventListeners[eventType];
    if(!listeners){
        return;
    }
    listeners.forEach(function (listener) {
        try{
            listener.call(this,e);
        }catch(e){
            console.error(e.stack || e);
        }
    }.bind(this));

};
ScrollBar.prototype._bindHorEvent = function () {

    var bar = this.hScrollbar.children[0];
    var startX,relativeLeft;
    bar.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        var pos = getMousePosition(e);
        startX = pos.pageX;
        relativeLeft = parseFloat(bar.style.left) || 0;
        userSelect(false);
    }.bind(this));
    var eventKey = this._id + 'hor';
    ScrollBar.mousemoveListeners[eventKey] = function (e) {

        if(!startX){
            return;
        }
        e.stopPropagation();
        var pos = getMousePosition(e);
        var left = relativeLeft + pos.pageX - startX;
        this.scrollLeft = this.getHScrollRatio() * left;

    }.bind(this);
    ScrollBar.mouseupListeners[eventKey] = function () {
        startX = relativeLeft = undefined;
        userSelect(true);
        if(!isElementInDom(this.element)){
            delete ScrollBar.mousemoveListeners[eventKey];
            delete ScrollBar.mouseupListeners[eventKey];
        }
    }.bind(this);

};
ScrollBar.prototype.getHScrollRatio = function () {

    var barWidth = this.getScrollbarWidth();
    var scrollContentWidth = this.clientWidth;
    scrollContentWidth -= this.config.width;
    var scrollRatio = (this.scrollWidth - this.clientWidth)/(scrollContentWidth - barWidth);
    return scrollRatio;

};
ScrollBar.prototype.getVScrollRatio = function () {

    var barHeight = this.getScrollbarHeight();
    var scrollContentHeight = this.clientHeight;
    scrollContentHeight -= this.config.height;
    var scrollRatio = (this.scrollHeight - this.clientHeight)/(scrollContentHeight - barHeight);
    return scrollRatio;

};
ScrollBar.prototype.scrollLeftTo = function (scrollLeft) {

    var maxScrollLeft = this.scrollWidth - this.clientWidth;
    if(arguments.length === 0){
        this._scrollLeft = Math.min(maxScrollLeft,this._scrollLeft);
        this._scrollLeft = Math.max(0,this._scrollLeft);
        return this._scrollLeft;
    }

    scrollLeft = Math.min(maxScrollLeft,scrollLeft);
    scrollLeft = Math.max(0,scrollLeft);
    var scrollRatio = this.getHScrollRatio();
    var barLeft = scrollLeft / scrollRatio;
    var bar = this.hScrollbar.children[0];
    style(bar,{
        left:barLeft + 'px'
    });
    this._scrollLeft = scrollLeft;

    this._getContentChildren().forEach(function (ele) {
        style(ele,{
            left: -scrollLeft + 'px'
        });
    });

    this.triggerScrollEvent();

};
ScrollBar.prototype._getContentChildren = function () {

    var children = this.element.children,length = children.length;
    var elements = [],ele;
    for(var i = 0;i < length;i++){
        ele = children[i];
        if(ele.vScrollbar || ele.hScrollbar){
            continue;
        }
        elements.push(ele);
    }
    return elements;

};
ScrollBar.prototype.scrollTopTo = function (scrollTop) {

    var maxScrollTop = this.scrollHeight - this.clientHeight;
    if(arguments.length === 0){
        this._scrollTop = Math.min(maxScrollTop,this._scrollTop);
        this._scrollTop = Math.max(0,this._scrollTop);
        return this._scrollTop;
    }

    var maxScrollTop = this.scrollHeight - this.clientHeight;
    scrollTop = Math.min(maxScrollTop,scrollTop);
    scrollTop = Math.max(0,scrollTop);
    var scrollRatio = this.getVScrollRatio();
    var barTop = scrollTop / scrollRatio;
    var bar = this.vScrollbar.children[0];
    style(bar,{
        top:barTop + 'px'
    });
    this._scrollTop = scrollTop;

    this._getContentChildren().forEach(function (ele) {
        style(ele,{
            top: -scrollTop + 'px'
        });
    });

    this.triggerScrollEvent();

};
ScrollBar.prototype._toggleVisible = function () {
    var attrName = 'hidden-scroll';
    this.hScrollbar.removeAttribute(attrName);
    this.vScrollbar.removeAttribute(attrName);
    var config = this.config;
    if(!config.autoHideX && !config.autoHideY){
        return;
    }
    var timeoutKey = this._id + 'hidden-v-scrollbar';
    executeFunctionTimeout(timeoutKey, function () {
        config.autoHideX && this.hScrollbar.setAttribute(attrName,'');
        config.autoHideY && this.vScrollbar.setAttribute(attrName,'');
    },config.timeout,this);
};
ScrollBar.prototype._bindVerEvent = function () {

    var bar = this.vScrollbar.children[0];
    var startY,relativeTop;
    bar.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        var pos = getMousePosition(e);
        startY = pos.pageY;
        relativeTop = parseFloat(bar.style.top) || 0;

        userSelect(false);
    }.bind(this));
    var eventKey = this._id + 'ver';
    ScrollBar.mousemoveListeners[eventKey] = function (e) {
        if(!startY){
            return;
        }
        e.stopPropagation();
        var pos = getMousePosition(e);
        var top = relativeTop + pos.pageY - startY;
        this.scrollTop = this.getVScrollRatio() * top;

    }.bind(this);
    ScrollBar.mouseupListeners[eventKey] = function () {
        startY = relativeTop = undefined;
        userSelect(true);
        if(!isElementInDom(this.element)){
            delete ScrollBar.mousemoveListeners[eventKey];
            delete ScrollBar.mouseupListeners[eventKey];
        }
    }.bind(this);

};
ScrollBar.prototype._bindScrollEvent = function () {

    this._bindHorEvent();
    this._bindVerEvent();
    this._bindMouseWheelEvent();
    this._bindTouchScrollEvent();

};
function isDefined(val){
    return val !== undefined;
}
function getWheelData (e,type) {

    var value;
    if(isDefined(value = e['delta' + type])){
    }else if(isDefined(value = e['wheelDelta' + type])){
    }else if(isDefined(value = e['wheelDelta'])){
    }else if(isDefined(value = e.detail)){
    }

    return value;

}
ScrollBar.prototype._bindMouseWheelEvent = function () {

    var _ = this;
    function wheelEvent(e){

        var lengthX = _.isScrollX() ? getWheelData(e,'X') : 0,
            lengthY = _.isScrollY() ? getWheelData(e,'Y') : 0;
        
        if(Math.abs(lengthX) > Math.abs(lengthY)){

            if(lengthX){
                lengthX = lengthX > 0 ? Math.max(200,lengthX) : Math.min(-200,lengthX);
                var lastScrollLeft = _.scrollLeft;
                _.scrollLeft = lastScrollLeft + (lengthX * 10 / _.getScrollbarWidth());
                if( _.scrollLeft !== lastScrollLeft){
                    e.preventDefault();
                }
            }
        }else{
            if(lengthY){
                lengthY = lengthY > 0 ? Math.max(200,lengthY) : Math.min(-200,lengthY);
                var lastScrollTop = _.scrollTop;
                _.scrollTop = lastScrollTop + (lengthY * 10 / _.getScrollbarHeight());
                if( _.scrollTop !== lastScrollTop){
                    e.preventDefault();
                }
            }
        }

    }
    var support = ['wheel','mousewheel'].some(function (evtType) {
        if(document['on' + evtType] !== undefined){
            this.element.addEventListener(evtType,wheelEvent);
            return true;
        }
    }.bind(this));
    if(support){
        return;
    }
    this.element.addEventListener('DOMMouseScroll',wheelEvent);

};
ScrollBar.prototype._getTouchEventListeners = function () {

    var _ = this;
    var listeners = this._touchListeners;
    if(!listeners){
        listeners = this._touchListeners = {
            startX:undefined,
            lastPageX:undefined,
            scrollTop:undefined,
            scrollLeft:undefined,
            startY:undefined,
            lastPageY:undefined,
            destroy: function () {
                this.startX = this.startY = undefined;
                this.lastPageX = this.lastPageY = undefined;
                this.scrollTop = this.scrollLeft = undefined;
            }
        };
        listeners.touchstart = function (e) {

            var pos = getMousePosition(e);
            listeners.startX = listeners.lastPageX = pos.pageX;
            listeners.startY = listeners.lastPageY = pos.pageY;
            listeners.scrollTop = this.scrollTop;
            listeners.scrollLeft = this.scrollLeft;
            userSelect(false);

        };
        listeners.touchmove = function (e) {

            if(!listeners.startX || !listeners.startY){
                return;
            }

            var pos = getMousePosition(e);
            var moveRatio = 0.8;
            if(Math.abs(pos.pageY - listeners.lastPageY) >= Math.abs(pos.pageX - listeners.lastPageX)){
                _.scrollTop += -(pos.pageY - listeners.lastPageY) * moveRatio;
            }else{
                _.scrollLeft += -(pos.pageX - listeners.lastPageX) * moveRatio;
            }

            listeners.lastPageY = pos.pageY;
            listeners.lastPageX = pos.pageX;

            e.preventDefault();
        };
        listeners.touchend = function () {

            listeners.destroy();
            userSelect(true);

        };
    }
    return listeners;

};
ScrollBar.prototype._bindTouchScrollEvent = function () {

    if(!isTouchSupported()){
        return;
    }
    var listeners = this._getTouchEventListeners();
    this.element.addEventListener('touchstart', listeners.touchstart,true);
    this.element.addEventListener('touchmove', listeners.touchmove,true);
    this.element.addEventListener('touchend', listeners.touchend,true);
    this.element.addEventListener('touchcancel', listeners.touchend,true);

};
ScrollBar.prototype.getScrollbarHeight = function () {

    var height = this.clientHeight,scrollHeight = this.scrollHeight;
    var barHeight = height / (scrollHeight / height);
    barHeight = Math.max(50,barHeight);
    return barHeight;

};
ScrollBar.prototype.getScrollbarWidth = function () {

    var width = this.clientWidth,scrollWidth = this.scrollWidth;
    var barWidth = width / (scrollWidth / width);
    barWidth = Math.max(50,barWidth);
    return barWidth;

};
ScrollBar.prototype._renderV = function () {

    var dom = document.createElement('div');
    dom.vScrollbar = true;
    dom.setAttribute('hidden-scroll','');
    this.vScrollbar = dom;
    dom.className = getFullClassName('scrollbar-ver');
    style(dom,{
        width:this.config.width + 'px',
        bottom:this.config.height + 'px',
        display:'none',
        'background-color':this.config.vTrackColor
    });

    var bar = this._createScrollBarBlock();
    style(bar,{
        'background-color':this.config.vScrollColor
    });

    dom.appendChild(bar);
    this.element.appendChild(dom);

};

/**
 * Created by koujp on 2016/10/17.
 */
function CellsModel(cellsModel){
    this.header = {
        fields:[] //{name:''}
    };
    this.rows = [];//[{fields:[]}]

    this._eventListener = {
        onAppendRows:[],
        onRefresh:[]
    };

    if(arguments.length > 0){
        this.init(cellsModel);
    }
}
CellsModel.prototype.init = function (cellsModel) {
    if(cellsModel.header && cellsModel.header.fields instanceof Array){
        this.header.fields = cellsModel.header.fields;
    }
    if(cellsModel.rows instanceof Array){
        this.rows = cellsModel.rows;
    }
    var eventListener = cellsModel._eventListener;
    if(!eventListener){
        return;
    }
    var context = this;
    ['appendRows','refresh'].forEach(function (eventName) {
        var listeners = eventListener[this.getEventKey(eventName)];
        if(listeners instanceof Array){
            listeners.forEach(function (listener) {
                context.bind(eventName,listener);
            });
        }
    });
};
CellsModel.prototype.bind = function (eventName,listener) {
    if(typeof eventName !== 'string' || typeof listener !== 'function'){
        return;
    }
    eventName = this.getEventKey(eventName);
    if(eventName && this._eventListener[eventName].indexOf(listener) === -1){
        this._eventListener[eventName].push(listener);
    }
};
CellsModel.prototype.getEventKey = function (eventName) {
    if(eventName.length > 1){
        eventName = 'on' + eventName[0].toUpperCase()  + eventName.substring(1);
        if(this._eventListener[eventName] instanceof Array){
            return eventName;
        }
    }
    return null;
};
CellsModel.prototype.trigger = function (eventName) {
    eventName = this.getEventKey(eventName);
    var listeners = this._eventListener[eventName];
    if(!(listeners instanceof Array)){
        return;
    }
    listeners.forEach(function (listener) {
        try{
            if(typeof listener === 'function'){
                listener();
            }
        }catch(e) {
            console.error(e);
        }
    });
};
CellsModel.prototype.refresh = function () {
    this.trigger('refresh');
};
CellsModel.prototype.appendRows = function (rows) {
    this.rows = this.rows.concat(rows);
    this.trigger('appendRows');
};

var onRemoveCell = function(){};
function Config(config){
    this.textTitle = false;
    this.colResize = false;
    this.rowResize = false;
    this.headerResize = false;
    this.scrollX = true;
    this.scrollY = true;
    this.minCellWidth = 50;
    this.minCellHeight = 50;
    this.renderCell = null;
    this.onRemoveCell = onRemoveCell;
    this.cacheCell = true;
    this.freezeConfig = {
        col:undefined,
        row:undefined,
        rowResize:true,
        colResize:true
    };
    if(config){
        Object.assign(this,config);
    }
}
Config.defaultConfig = function () {
    return new Config()
};

/**
 * Created by koujp on 2016/10/17.
 */
function _setRenderTo(renderTo) {

    if(typeof renderTo === 'string'){
        renderTo = document.querySelector(renderTo);
    }

    if(!isDomElement(renderTo)){
        throw new TypeError('renderTo must be a dom element !');
    }

    this.renderTo = renderTo;

}
var Cells = Class.create(function (cellsModel,config) {
    init.apply(this,arguments);
});
var _toString_ = Object.prototype.toString;
var _noonObj_ = {};
function isPlainObject(obj) {
    return _toString_.call(obj) === _toString_.call(_noonObj_);
}
function assignConfig(config,newConfig) {
    Object.keys(newConfig).forEach(function(key){
        var val = config[key],newVal = newConfig[key];
        if(isPlainObject(newVal)){
            if(!isPlainObject(val)){
                config[key] = newVal;
            }else{
                newVal = assignConfig(val,newVal);
            }
        }
        config[key] = newVal;
    });
    return config;
}
function init(cellsModel,config) {

    if(!(cellsModel instanceof CellsModel)){
        throw new TypeError('arguments must be instanceof CellsModel !');
    }
    Object.defineProperty(this,'cellsModel',{
        value:cellsModel
    });

    var renderTo = config.renderTo;
    delete config.renderTo;
    _setRenderTo.call(this,renderTo);


    this.config = assignConfig(Config.defaultConfig(),config);
    Object.freeze(this.config);


}
var _prototype = Cells.prototype;
Cells.extend = function (extend) {

    Object.keys(arguments[0]).forEach(function (key) {
        _prototype[key] = extend[key];
    });

};
Cells.publishMethod = function (methodNames,instanceName) {

    if(!methodNames || !instanceName){
        return;
    }
    methodNames = [].concat(methodNames);
    methodNames.forEach(function (methodName) {
        _prototype[methodName] = function () {
            var context = this[instanceName];
            var method = typeof methodName === 'function' ? methodName : context[methodName];
            if(typeof method === 'function'){
                return method.apply(context,arguments);
            }
        };
    });
};

var CellsEvent = Class.create(function (cellsInstance) {

    this.cellsInstance = cellsInstance;
    Object.defineProperty(this,'eventManager',{
        value:{}
    });

});
var _prototype$1 = CellsEvent.prototype;
_prototype$1.extendEventType = function (eventType,listeners) {

    if(!listeners){
        listeners = [];
    }else{
        listeners = [].concat(listeners);
    }
    if(!this.eventManager[eventType]){
        this.eventManager[eventType] = listeners;
    }

};
_prototype$1.getEventListeners = function (eventType) {

    return this.eventManager[eventType] || [];

};
_prototype$1.existEventListener = function (eventType) {

    var listeners = this.eventManager[eventType];
    return listeners && listeners.length > 0;

};
CellsEvent.createEvent = function createEvent(eventType,target,data,origin) {

    return {
        type:eventType,
        target:target,
        data:data,
        origin:origin
    };

};
_prototype$1.addEventListener = function addEventListener(eventType,func) {

    var handlers = this.eventManager[eventType];
    if(!handlers){
        handlers = this.eventManager[eventType] = [];
    }
    if(handlers.indexOf(func) === -1){
        handlers.push(func);
    }
    return this;
};
_prototype$1.removeEventListener = function removeEventListener(eventType,func) {

    var handlers = this.getEventListeners(eventType);
    if(!handlers){
        return;
    }
    var index = handlers.indexOf(func);
    if(index >= 0){
        handlers.splice(index,1);
        return func;
    }

};
_prototype$1.triggerEvent = function triggerEvent(event) {

    var eventType = event.type;
    var handlers = this.getEventListeners(eventType);
    if(!handlers){
        return;
    }
    handlers.forEach(function (handler) {
        requestAnimationFrame(function () {
            handler.call(event.target,event);
        });
    }.bind(this));

};
Cells.publishMethod(['addEventListener','removeEventListener','triggerEvent'],'cellsEvent');
Cells.addInitHooks(function () {
    this.cellsEvent = new CellsEvent(this);
});

var _prototype$3 = {};
_prototype$3.render = function(){
    var contentPanel = this.bodyPanel._contentPanel;
    var freezeContainer = this._createFreezeContainer();
    contentPanel.appendChild(freezeContainer);
};
_prototype$3._createFreezeContainer = function(){

    var freezeCol = document.createElement('div');
    freezeCol.className = getFullClassName('freeze-col-container');

    var freezeRow = document.createElement('div');
    freezeRow.className = getFullClassName('freeze-row-container');

    var freezeCross = document.createElement('div');
    freezeCross.className = getFullClassName('freeze-cross-container');

    var freezeContainer = document.createElement('div');
    freezeContainer.className = getFullClassName('freeze-container');

    freezeContainer.appendChild(freezeCross);
    freezeContainer.appendChild(freezeCol);
    freezeContainer.appendChild(freezeRow);

    return freezeContainer;
};
_prototype$3._createHeaderFreezeContainer = function(){
    var freezeContainer = document.createElement('div');
    freezeContainer.className = getFullClassName('freeze-header-container');
    return freezeContainer;
};
_prototype$3.getFreezeHeaderPanel = function(){
    var selector = getFullClassSelector('freeze-header-container');
    return this.headerPanel.querySelector(selector);
};
_prototype$3._getFreezeColPanel = function(){
    var bodyPanel = this.bodyPanel;
    var selector = getFullClassSelector('freeze-col-container');
    return bodyPanel.querySelector(selector);
};
_prototype$3._getFreezeRowPanel = function(){
    var bodyPanel = this.bodyPanel;
    var selector = getFullClassSelector('freeze-row-container');
    return bodyPanel.querySelector(selector);
};
_prototype$3._getFreezeCrossPanel = function(){
    var bodyPanel = this.bodyPanel;
    var selector = getFullClassSelector('freeze-cross-container');
    return bodyPanel.querySelector(selector);
};
_prototype$3.paintFreezeRow = function(){


    var paintState = this.paintState,
        domCache = this.domCache;
    var blnFreezeRow = this._isFreezeRow();
    if(!blnFreezeRow){
        this.removeCells(domCache.freezeRowCells);
        return;
    }
    var colClientArea = paintState.currentColArea;

    var cacheCells = domCache.freezeRowCells;
    var cells = cacheCells.filter(function (cell) {
        var col = parseInt(cell.getAttribute('col'));
        var inCol = col >= colClientArea.from && col < colClientArea.from + colClientArea.pageSize;
        return !inCol;
    });

    var contentPanel = this._getFreezeRowPanel();

    var areas = this.getFreezeRowAreas();
    this._paintFreezeAreaCells(contentPanel,cells,cacheCells,areas);

};
_prototype$3._isFreezeCrossCellArea = function(rowIndex,colIndex){
    var cellsInstance = this.cellsInstance;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeCol = freezeConfig.col,
        freezeRow = freezeConfig.row;
    return rowIndex < freezeRow && colIndex < freezeCol;
};
_prototype$3._isFreezeArea = function(row,col){
    return this._isFreezeRow(row) || this._isFreezeCol(col);
};
_prototype$3._paintFreezeAreaCells = function(contentPanel,cells,cacheCells,areas){

    var cellsInstance = this.cellsInstance,
        rows = cellsInstance.cellsModel.rows;
    areas.forEach(function (area) {
        var row, cell, field;
        for (var rowIndex = area.top; rowIndex < area.bottom; rowIndex++) {
            row = rows[rowIndex];
            for (var colIndex = area.left; colIndex < area.right; colIndex++) {

                if(this._isFreezeCrossCellArea(rowIndex,colIndex)){
                    continue;
                }

                field = row.fields[colIndex];
                cell = null;
                if(this.isNeedCache(field)){
                    cell = cells.pop();
                }
                if (!cell) {
                    cell = this._createCell(rowIndex, colIndex, field,cacheCells);
                    cell._freezeCell = true;
                    contentPanel.appendChild(cell);
                }
                this._paintCell(cell, rowIndex, colIndex, field);
            }
        }
    }.bind(this));

    this.removeCells(cacheCells, cells);
};
_prototype$3._isFreezeCol = function(col){
    var cellsInstance = this.cellsInstance;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeCol = freezeConfig.col;

    var blnFreezeCol = typeof freezeCol === 'number' && freezeCol > 0;
    if(arguments.length > 0 && typeof col === 'number'){
        blnFreezeCol = blnFreezeCol && col < freezeCol;
    }
    return blnFreezeCol;

};
_prototype$3._isFreezeRow = function(row){
    var cellsInstance = this.cellsInstance;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeRow = freezeConfig.row;

    var blnFreezeRow = typeof freezeRow === 'number' && freezeRow > 0;
    if(arguments.length > 0 && typeof row === 'number'){
        blnFreezeRow = blnFreezeRow && row < freezeRow;
    }
    return blnFreezeRow;
};
_prototype$3._isFreezeCross = function(){
    return this._isFreezeRow() && this._isFreezeCol();
};
_prototype$3.paintFreezeCol = function(){


    var paintState = this.paintState,
        domCache = this.domCache;

    var blnFreezeCol = this._isFreezeCol();
    if(!blnFreezeCol){
        this.removeCells(domCache.freezeColCells);
        return;
    }

    var rowClientArea = paintState.currentRowArea;

    var cacheCells = domCache.freezeColCells;
    var cells = cacheCells.filter(function (cell) {
        var row = parseInt(cell.getAttribute('row'));
        var inRow = row >= rowClientArea.from && row < rowClientArea.from + rowClientArea.pageSize;
        return !inRow;
    });

    var contentPanel = this._getFreezeColPanel();

    var areas = this.getFreezeColAreas();
    this._paintFreezeAreaCells(contentPanel,cells,cacheCells,areas);
};
_prototype$3.paintFreezeCross = function(){
    var cellsInstance = this.cellsInstance,
        rows = cellsInstance.cellsModel.rows;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeCol = freezeConfig.col,
        freezeRow = freezeConfig.row;

    var blnFreezeCross = this._isFreezeCross();
    var cacheCells = this.domCache.freezeCrossCells;
    if(!blnFreezeCross){
        this.removeCells(cacheCells);
        return;
    }

    if(cacheCells.length > 0){
        return;
    }
    var paintState = this.paintState;
    var rowPageSize = paintState.currentRowArea.pageSize,
        colPageSize = paintState.currentColArea.pageSize;

    freezeCol = Math.min(freezeCol,colPageSize);
    freezeRow = Math.min(freezeRow,rowPageSize);


    var freezePanel = this._getFreezeCrossPanel();
    var row,field,cell;
    for(var rowIndex = 0;rowIndex < freezeRow;rowIndex++){
        row = rows[rowIndex];
        for(var colIndex = 0;colIndex < freezeCol;colIndex++){
            field = row.fields[colIndex];
            cell = this._createCell(rowIndex, colIndex, field,cacheCells);
            cell._freezeCell = true;
            this._paintCell(cell, rowIndex, colIndex, field);
            freezePanel.appendChild(cell);
        }
    }

};
_prototype$3.paintFreeze = function(){

    this.adjustScroll();
    this.paintFreezeHeader();
    this.paintFreezeCross();
    this.paintFreezeCol();
    this.paintFreezeRow();
};
_prototype$3.paintFreezeHeader = function(){

    var blnFreezeCol = this._isFreezeCol();
    var cacheCells = this.domCache.freezeHeaderCells;
    if(!blnFreezeCol){
        this.removeCells(cacheCells);
        return;
    }

    var cellsInstance = this.cellsInstance;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeCol = freezeConfig.col;

    var paintState = this.paintState;
    var colPageSize = paintState.currentColArea.pageSize;
    freezeCol = Math.min(freezeCol,colPageSize);

    var cellsModel = cellsInstance.cellsModel,
        headerFreezePanel = this.getFreezeHeaderPanel();

    if(cacheCells.length > 0){
        return;
    }

    var fields = cellsModel.header.fields;
    var field,cell;
    for(var i = 0;i < freezeCol;i++){
        field = fields[i];
        cell = this._createHeaderCell(0, i, field,cacheCells);
        cell._freezeCell = true;
        this._paintCell(cell, 0, i, field);
        headerFreezePanel.appendChild(cell);
    }
};
_prototype$3.adjustFreezeRowScroll = function(){

    if(!this._isFreezeRow()){
        return;
    }
    var scroll = this.scrollTo();
    var rowPanel = this._getFreezeRowPanel();
    var css = {};
    if(this.isCustomScroll){
        css.left =  -scroll.scrollLeft + 'px';
    }else{
        css.top = scroll.scrollTop + 'px';
    }
    style(rowPanel,css);
};
_prototype$3.adjustFreezeColScroll = function(){

    if(!this._isFreezeCol()){
        return;
    }
    var scroll = this.scrollTo();
    var colPanel = this._getFreezeColPanel();
    var css = {};
    if(this.isCustomScroll){
        css.top =  -scroll.scrollTop + 'px';
    }else{
        css.left = scroll.scrollLeft + 'px';
    }
    style(colPanel,css);
};
_prototype$3.adjustFreezeCrossScroll = function(){

    if(!this._isFreezeCross()){
        return;
    }
    var scroll = this.scrollTo();
    var crossPanel = this._getFreezeCrossPanel();
    var css = {};
    if(!this.isCustomScroll){
        css.top =  scroll.scrollTop + 'px';
        css.left = scroll.scrollLeft + 'px';
    }
    style(crossPanel,css);
};
_prototype$3.adjustScroll = function(){
   this.adjustFreezeCrossScroll();
   this.adjustFreezeRowScroll();
   this.adjustFreezeColScroll();
};
_prototype$3.getFreezeRowAreas = function () {

    var cellsInstance = this.cellsInstance;
    var paintState = this.paintState;
    var rowPageSize = paintState.currentRowArea.pageSize;
    var colPaintAreas = [].concat(paintState.colPaintAreas);
    var areas = [];
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeRow = freezeConfig.row;

    freezeRow = Math.min(freezeRow,rowPageSize);
    colPaintAreas.forEach(function(colArea){
        var area = {
            top: 0,
            bottom: freezeRow,
            left: colArea.from,
            right: colArea.from + colArea.pageSize
        };
        areas.push(area);
    });
    return areas;
};
_prototype$3.getFreezeColAreas = function () {

    var cellsInstance = this.cellsInstance;
    var paintState = this.paintState;
    var colPageSize = paintState.currentColArea.pageSize;
    var rowPaintAreas = [].concat(paintState.rowPaintAreas);
    var areas = [];
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeCol = freezeConfig.col;

    freezeCol = Math.min(freezeCol,colPageSize);
    rowPaintAreas.forEach(function(rowArea){
        var area = {
            top: rowArea.from,
            bottom: rowArea.from + rowArea.pageSize,
            left: 0,
            right: freezeCol
        };
        areas.push(area);
    });
    return areas;
};
_prototype$3.getFreezeCells = function () {

    var domCache = this.domCache;
    return domCache.freezeRowCells.concat(domCache.freezeColCells).concat(domCache.freezeCrossCells).concat(domCache.freezeHeaderCells);
};

var _cellSupportStyles = ['background', 'backgroundColor', 'backgroundImage', 'backgroundRepeat', 'backgroundSize'];


var CellsRender = Class.create(function (cellsInstance) {

    this.cellsInstance = cellsInstance;

    this.cellsPanel = null;
    this.headerPanel = null;
    this.bodyPanel = null;
    this.cursor = null;

    var cellsEvent = cellsInstance.cellsEvent;
    cellsEvent.extendEventType('renderFinished', []);
    cellsEvent.extendEventType('click', []);
    cellsEvent.extendEventType('cellClick', []);
    cellsEvent.extendEventType('scroll', []);
    cellsEvent.extendEventType('cellPainted', []);

});

CellsRender.extend(_prototype$3);

var _prototype$2 = CellsRender.prototype;
function transformStyleName(styleName) {
    return styleName.replace(/-(\w)/g, function (match, str) {
        return str ? str.toUpperCase() : '';
    });
}
CellsRender.expandSupportStyles = function (styleNames) {
    if (styleNames) {
        styleNames = [].concat(styleNames);
    }
    styleNames.forEach(function (styleName) {
        styleName = transformStyleName[styleName];
        if (_cellSupportStyles.indexOf(styleName) === -1) {
            _cellSupportStyles.push(styleName);
        }
    });
};
_prototype$2.initRenderState = function () {

    this.paintState = {
        lastRowArea: null,
        currentRowArea: null,
        lastColArea: null,
        currentColArea: null,
        rowPaintAreas: null,
        colPaintAreas: null,
        reset: function () {
            this.lastRowArea = null;
            this.currentRowArea = null;
            this.lastColArea = null;
            this.currentColArea = null;
            this.rowPaintAreas = null;
            this.colPaintAreas = null;
        }
    };
    this.domCache = {
        clearCells: function () {
            this.headerCells.length = 0;
            this.cells.length = 0;
            this.freezeHeaderCells.length = 0;
            this.freezeRowCells.length = 0;
            this.freezeColCells.length = 0;
            this.freezeCrossCells.length = 0;
        },
        headerCells: [],
        cells: [],
        freezeHeaderCells:[],
        freezeRowCells:[],
        freezeColCells:[],
        freezeCrossCells:[],
        colsWidth: [],
        colsLeft: [],
        rowsTop: [],
        rowsHeight: [],
        headerHeight: 0,
    };

};
function initRender() {

    var cellsInstance = this.cellsInstance;
    this.initRenderState();
    var renderTo = cellsInstance.renderTo;
    if (!renderTo || renderTo.nodeType !== 1) {
        throw new TypeError('parent container is invalid !');
    }

    var cellsPanel = this.cellsPanel = document.createElement('div');
    cellsPanel.className = getFullClassName();
    var dirtyPanel = renderTo.querySelector(getFullClassSelector());
    dirtyPanel && renderTo.removeChild(dirtyPanel);

    cellsPanel.appendChild(this._createHeader());

    cellsPanel.appendChild(this._createBodyContainer());
    renderTo.appendChild(cellsPanel);

    var config = cellsInstance.config;
    var customScroll = config.customScroll;
    var scrollbar;
    if (customScroll) {
        var scrollOption = Object.assign({}, customScroll);
        scrollOption.scrollX = config.scrollX;
        scrollOption.scrollY = config.scrollY;
        scrollbar = new ScrollBar(this.bodyPanel, scrollOption);
    } else {
        scrollbar = this.bodyPanel;
    }
    Object.defineProperty(this,'isCustomScroll',{
        value:!!customScroll
    });
    Object.defineProperty(this, 'scrollbar', {
        configurable: true,
        get: function () {
            return scrollbar;
        }
    });

    this._createCursor();

    this.bindEvent();

}
var headerContentClassName = 'header-content';
_prototype$2._initPanelSize = function () {

    var cellsPanel = this.cellsPanel;

    cellsPanel.currentWidth = this.headerPanel.clientWidth;
    cellsPanel.currentHeight = cellsPanel.clientHeight;


};
_prototype$2.getPanelSize = function () {

    return {
        width: this.cellsPanel.currentWidth,
        height: this.cellsPanel.currentHeight
    };

};
_prototype$2.computeScrollbarState = function(){
    var scrollbar = this.scrollbar;
    if(scrollbar !== this.bodyPanel){
        return;
    }
    var style$$1 = window.getComputedStyle(scrollbar);
    var leftBorderW = parseInt(style$$1.borderLeftWidth),
        rightBorderW = parseInt(style$$1.borderRightWidth),
        topBorderW = parseInt(style$$1.borderTopWidth),
        bottomBorderW = parseInt(style$$1.borderBottomWidth);

    var scrollWidth = scrollbar.scrollWidth,
        offsetWidth = scrollbar.offsetWidth,
        scrollHeight = scrollbar.scrollHeight,
        offsetHeight = scrollbar.offsetHeight;
    var scrollX = scrollWidth + leftBorderW + rightBorderW > offsetWidth;
    var scrollY = scrollHeight + topBorderW + bottomBorderW > offsetHeight;
    scrollbar.setAttribute('scrollX',String(scrollX));
    scrollbar.setAttribute('scrollY',String(scrollY));
};
_prototype$2.resizeScrollbar = function resizeScrollbar() {

    var cellsInstance = this.cellsInstance;
    if (cellsInstance.config.customScroll) {
        this.scrollbar.resize();
        return;
    }

};
_prototype$2.getCurrentColArea = function getCurrentColArea() {

    var scrollbar = this.scrollbar;
    var panelSize = this.getPanelSize();
    var colsLeft = this.domCache.colsLeft;
    var left = scrollbar.scrollLeft;
    return this.getThresholdArea(panelSize.width, colsLeft, left);

};

_prototype$2.getThresholdArea = function getThresholdArea(viewSize, positions, cursor) {

    var from = 0,
        end, i;

    if (!positions.some(function (position, index) {
            if (position >= cursor) {
                from = index;
                return true;
            }
        })) {
        from = positions.length - 1;
    }
    var mid = from;
    for (i = mid; i >= 0; i--) {
        if (positions[mid] - positions[i] >= viewSize) {
            break;
        }
    }
    from = Math.max(0, i);
    for (i = mid; i < positions.length; i++) {
        if (positions[i] - positions[mid] > viewSize) {
            break;
        }
    }
    end = Math.min(positions.length, i);

    var area = {
        from: from,
        pageSize: end - from
    };
    return this.normalizeArea(area, positions);

};
_prototype$2.getCurrentRowArea = function getCurrentRowArea() {

    var scrollbar = this.scrollbar;
    var panelSize = this.getPanelSize();
    var rowsTop = this.domCache.rowsTop;
    var top = scrollbar.scrollTop;
    return this.getThresholdArea(panelSize.height, rowsTop, top);

};
_prototype$2.getRowPaintAreas = function getRowPaintAreas() {

    return this._getPaintAreas('row');

};
_prototype$2.getColPaintAreas = function getColPaintAreas() {

    return this._getPaintAreas('col');

};
_prototype$2.normalizeArea = function (area, positions) {

    area.from = Math.max(0, area.from);
    area.from = Math.min(positions.length - 1, area.from);
    area.pageSize = Math.max(0, area.pageSize);
    area.pageSize = Math.min(positions.length - area.from, area.pageSize);
    return area;
};
_prototype$2._getPaintAreas = function _getPaintAreas(type) {

    var paintState = this.paintState;
    var lastArea = type === 'row' ? paintState.lastRowArea : paintState.lastColArea,
        curArea = type === 'row' ? paintState.currentRowArea : paintState.currentColArea;

    var domCache = this.domCache;

    var positions = type === 'row' ? domCache.rowsTop : domCache.colsLeft;

    var areas = [];
    if (lastArea == null) {
        areas.push(curArea);
        return areas;
    }

    if (lastArea.from === curArea.from && lastArea.pageSize === curArea.pageSize) {
        return areas;
    }
    var area;
    if (curArea.from >= lastArea.from) {

        if (lastArea.from + lastArea.pageSize <= curArea.from) {
            areas.push(curArea);
        } else {
            area = this.normalizeArea({
                from: lastArea.from + lastArea.pageSize,
                pageSize: curArea.from + curArea.pageSize - (lastArea.from + lastArea.pageSize)
            }, positions);
            if (area.pageSize > 0) {
                areas.push(area);
            }

        }

    } else {

        if (curArea.from + curArea.pageSize <= lastArea.from) {
            areas.push(curArea);
        } else {
            area = this.normalizeArea({
                from: curArea.from,
                pageSize: lastArea.from - curArea.from
            }, positions);
            if (area.pageSize > 0) {
                areas.push(area);
            }
            var bottomDis = curArea.from + curArea.pageSize - (lastArea.from + lastArea.pageSize);
            if (bottomDis > 0) {

                area = this.normalizeArea({
                    from: lastArea.from + lastArea.pageSize,
                    pageSize: bottomDis
                }, positions);
                if (area.pageSize > 0) {
                    areas.push(area);
                }

            }
        }

    }
    return areas;

};
_prototype$2.initPaint = function () {

    var cellsInstance = this.cellsInstance;
    var domCache = this.domCache;
    var cells = cellsInstance.renderTo.querySelectorAll(getFullClassSelector('cell')),
        size = cells.length;
    for (var i = 0; i < size; i++) {
        this.removeElementFromDom(cells[i]);
    }
    domCache.clearCells();
    var paintState = this.paintState;
    paintState.reset();

};
_prototype$2.executePaint = function () {

    var paintState = this.paintState;
    paintState.currentRowArea = this.getCurrentRowArea();
    paintState.currentColArea = this.getCurrentColArea();
    paintState.rowPaintAreas = this.getRowPaintAreas();
    paintState.colPaintAreas = this.getColPaintAreas();
    this.paintHeader();
    this.paintFreeze();
    this.paintBody();
    paintState.lastRowArea = paintState.currentRowArea;
    paintState.lastColArea = paintState.currentColArea;

};
_prototype$2.getHeaderContentPanel = function () {

    var headerContentPanel = this.headerPanel._contentPanel;
    return headerContentPanel;
};
_prototype$2.getHeaderCells = function () {

    return this.domCache.headerCells;

};
_prototype$2.getBodyCells = function () {

    return this.domCache.cells;

};
_prototype$2.paintHeader = function paintHeader() {

    var cellsInstance = this.cellsInstance,
        cellsModel = cellsInstance.cellsModel,
        cellsCache = this.domCache.headerCells,
        headerContentPanel = this.getHeaderContentPanel();

    var paintState = this.paintState;
    var colPaintAreas = [].concat(paintState.colPaintAreas),
        colClientArea = paintState.currentColArea;


    var cells = cellsCache.filter(function (cell) {
        var col = parseInt(cell.getAttribute('col'));
        var inCol = col >= colClientArea.from && col < colClientArea.from + colClientArea.pageSize;
        return !inCol;
    });

    var fields = cellsModel.header.fields;
    colPaintAreas.forEach(function (colArea) {
        var cell, field;
        for (var colIndex = colArea.from; colIndex < colArea.from + colArea.pageSize; colIndex++) {
            if(this._isFreezeCol(colIndex)){
                continue;
            }
            field = fields[colIndex];
            cell = null;
            if(this.isNeedCache(field)){
                cell = cells.pop();
            }
            if (!cell) {
                cell = this._createHeaderCell(0, colIndex, field);
                headerContentPanel.appendChild(cell);
            }
            this._paintCell(cell, 0, colIndex, field);
        }
    }.bind(this));

    this.removeCells(cellsCache, cells);

};
_prototype$2.getBodyPaintRectAreas = function () {
    var paintState = this.paintState;
    var rowPaintAreas = [].concat(paintState.rowPaintAreas),
        colPaintAreas = [].concat(paintState.colPaintAreas);
    var rowClientArea = paintState.currentRowArea,
        colClientArea = paintState.currentColArea;
    var areas = [];
    rowPaintAreas.forEach(function (rowArea) {
        colPaintAreas.forEach(function (colArea) {
            var area = {
                top: rowArea.from,
                bottom: rowArea.from + rowArea.pageSize,
                left: colArea.from,
                right: colArea.from + colArea.pageSize
            };
            areas.push(area);
        });
    });
    paintState.lastColArea !== null && rowPaintAreas.forEach(function (rowArea) {
        var area = {
            top: rowArea.from,
            bottom: rowArea.from + rowArea.pageSize,
            left: colClientArea.from,
            right: colClientArea.from + colClientArea.pageSize
        };
        areas.push(area);
    });
    paintState.lastRowArea !== null && colPaintAreas.forEach(function (colArea) {
        var area = {
            top: rowClientArea.from,
            bottom: rowClientArea.from + rowClientArea.pageSize,
            left: colArea.from,
            right: colArea.from + colArea.pageSize
        };
        areas.push(area);
    });

    return areas;

};
_prototype$2.isNeedCache = function(field){
    if(typeof field.cacheCell === 'boolean'){
        return field.cacheCell;
    }
    return this.cellsInstance.config.cacheCell;
};
_prototype$2.paintBody = function paintBody() {

    var cellsInstance = this.cellsInstance;
    var paintState = this.paintState,
        domCache = this.domCache,
        rows = cellsInstance.cellsModel.rows;

    var rowClientArea = paintState.currentRowArea,
        colClientArea = paintState.currentColArea;

    var cacheCells = domCache.cells;
    var cells = cacheCells.filter(function (cell) {
        var r = parseInt(cell.getAttribute('row')),
            col = parseInt(cell.getAttribute('col'));
        var inRow = r >= rowClientArea.from && r < rowClientArea.from + rowClientArea.pageSize,
            inCol = col >= colClientArea.from && col < colClientArea.from + colClientArea.pageSize;
        return !inRow || !inCol;
    });


    var contentPanel = this.bodyPanel._contentPanel;

    var areas = this.getBodyPaintRectAreas();
    areas.forEach(function (area) {
        var row, cell, field;
        for (var rowIndex = area.top; rowIndex < area.bottom; rowIndex++) {
            row = rows[rowIndex];
            if(this._isFreezeRow(rowIndex)){
                continue;
            }
            for (var colIndex = area.left; colIndex < area.right; colIndex++) {
                if(this._isFreezeCol(colIndex)){
                    continue;
                }
                field = row.fields[colIndex];
                cell = null;
                if(this.isNeedCache(field)){
                    cell = cells.pop();
                }
                if (!cell) {
                    cell = this._createCell(rowIndex, colIndex, field);
                    contentPanel.appendChild(cell);
                }
                this._paintCell(cell, rowIndex, colIndex, field);
            }
        }
    }.bind(this));

    this.removeCells(cacheCells, cells);

};
_prototype$2.removeCells = function removeCells(cacheCells, cells) {

    var _ = this;
    var config = this.cellsInstance.config;
    cells = cells || cacheCells;
    cells.forEach(function (cell) {
        var index = cacheCells.indexOf(cell);
        if(index !== -1){
            cacheCells.splice(index, 1);
        }
        var onRemoveCell = config.onRemoveCell;
        try{
            if(typeof onRemoveCell === 'function'){
                onRemoveCell(cell);
            }
        }catch(e){}
        _.removeElementFromDom(cell);
    });

};
_prototype$2.removeElementFromDom = function (cell) {

    if (cell.remove) {
        cell.remove();
    } else if (cell.parentNode) {
        cell.parentNode.removeChild(cell);
    }

};
_prototype$2.computeRowTop = function computeRowTop(row) {

    var rowsTop = this.domCache.rowsTop;
    return rowsTop[row];

};
_prototype$2._paintCell = function _paintCell(cell, row, col, field) {

    cell.setAttribute('row', '' + row);
    cell.setAttribute('col', '' + col);
    this._configCell(cell, field);
    this._reLayoutCell(cell);

};
_prototype$2.emptyElement = function (element) {
    while (element.firstChild) {
        this.removeElementFromDom(element.firstChild);
    }
};
function isDomNode(object) {
    if (typeof object !== 'object') {
        return false;
    }
    return object.nodeType !== void 0 && object.tagName !== void 0;
}
function parseDom(text){
    if (typeof text === 'object' && isDomNode(text)) {
        return [text];
    }
    else if (typeof text === 'string') {
        var div = document.createElement('div');
        div.innerHTML = text;
        return Array.prototype.slice.call(div.childNodes);
    }else if(text instanceof Array){
        if(text.every(function(node){
                return isDomNode(node);
            })){
            return text;
        }
    }
    throw new Error('invalid data !');

}
function isDefined$1(v) {
    return v !== undefined && v !== null;
}
_prototype$2._configCell = function _configCell(cell, field) {

    var cellsInstance = this.cellsInstance;
    var config = cellsInstance.config;
    var render = field.render || config.renderCell;
    var defaultPaint = this.paintCellContent.bind(this);
    if(typeof render === 'function'){
        cell._textSpan = null;
        render.call(this,cell,field,defaultPaint);
        return cell;
    }

    return this.paintCellContent(cell,field);

};
_prototype$2.paintCellContent = function(cell,field){

    var cellsInstance = this.cellsInstance;
    var config = cellsInstance.config;
    var isHtml = (field.html !== null && field.html !== undefined);
    cell.setAttribute('html_content', isHtml + '');
    if (isHtml) {
        cell.innerHTML = '';
        parseDom(field.html).forEach(function (node) {
            cell.appendChild(node);
        });
        cell._textSpan = null;
    } else {
        var text = field.name;
        if(!isDefined$1(text)){
            text = isDefined$1(field.value) ? field.value : '';
        }
        var span;
        if (!cell._textSpan) {
            cell.innerHTML = '';
            span = document.createElement('span');
            cell.appendChild(span);
            cell._textSpan = span;
        } else {
            span = cell._textSpan;
        }
        span.innerText = text;
        if (config.textTitle) {
            cell.setAttribute('title', text);
        }
    }
    return cell;
};
_prototype$2._createHeaderCell = function (row, col, field,cells) {

    var cell = this._createCell(row, col, field, cells || this.domCache.headerCells);
    cell._headerCell = true;
    return cell;

};
_prototype$2._createCell = function _createCell(row, col, field, cacheCells) {

    var cacheCells = cacheCells || this.domCache.cells;
    var cell = document.createElement('div');
    cell._cell = true;

    var classNames = [getFullClassName('cell')];
    cell.className = classNames.join(' ');

    cacheCells.push(cell);


    return cell;

};
_prototype$2._reLayoutCell = function _reLayoutCell(cell) {

    var cellsInstance = this.cellsInstance;
    var row = parseInt(cell.getAttribute('row')),
        col = parseInt(cell.getAttribute('col'));
    var domCache = this.domCache,
        colsLeft = domCache.colsLeft,
        colsWidth = domCache.colsWidth,
        rowsHeight = domCache.rowsHeight;

    //last column flag
    var cellsModel = cellsInstance.cellsModel,
        headerFields = cellsModel.header.fields,
        rows = cellsModel.rows,
        header = cellsModel.header;
    var colLast = String(headerFields.length - 1 === col),
        rowLast = String(rows.length - 1 === row);
    cell.setAttribute('col-last', colLast);
    cell.setAttribute('row-last', rowLast);

    style(cell, {
        left: colsLeft[col] + 'px',
        top: this.computeRowTop(row) + 'px',
        width: colsWidth[col] + 'px',
        height: rowsHeight[row] + 'px'
    });

    if (cell._customStyleKeys) {
        cell._customStyleKeys.forEach(function (key) {
            style(cell, key, '');
        });
    }

    var fields = cell._headerCell ? header.fields : rows[row].fields,
        field = fields[col];

    var fieldStyle = field.style;
    var customStyleKeys = [];
    if (fieldStyle) {
        Object.keys(fieldStyle).forEach(function (key) {
            if (key in cell.style) {
                if (_cellSupportStyles.indexOf(transformStyleName(key)) === -1) {
                    return;
                }
                style(cell, key, fieldStyle[key]);
                customStyleKeys.push(key);
            }
        });
    }
    cell._customStyleKeys = customStyleKeys;

};
_prototype$2._createCursor = function _createCursor() {

    var cursor = document.createElement('i');
    cursor.className = getFullClassName('row-cursor');

    this.cursor = cursor;
    this.bodyPanel._contentPanel.appendChild(cursor);

    return cursor;

};
_prototype$2._createBodyContainer = function _createBodyContainer() {

    var cellsInstance = this.cellsInstance;
    var bodyContainer = this.bodyPanel = document.createElement('div');
    bodyContainer.className = getFullClassName('body-container');

    bodyContainer.setAttribute('scroll-x', String(cellsInstance.config.scrollX));
    bodyContainer.setAttribute('scroll-y', String(cellsInstance.config.scrollY));

    var rowContainer = this._createRowContainer();
    bodyContainer.appendChild(rowContainer);

    var freezeContainer = this._createFreezeContainer();
    bodyContainer.appendChild(freezeContainer);

    bodyContainer._contentPanel = rowContainer;
    return bodyContainer;
};
_prototype$2._createRowContainer = function _createRowContainer() {

    var rowContainer = document.createElement('div');
    rowContainer.className = getFullClassName('row-container');
    return rowContainer;

};
_prototype$2._createHeader = function _createHeader() {

    var headerContainer = document.createElement('header');
    headerContainer.className = getFullClassName('header');
    this.headerPanel = headerContainer;

    var headerContentPanel = document.createElement('div');
    headerContentPanel.className = getFullClassName(headerContentClassName);

    headerContainer.appendChild(headerContentPanel);

    var headerFreeContainer = this._createHeaderFreezeContainer();
    headerContainer.appendChild(headerFreeContainer);

    headerContainer._contentPanel = headerContentPanel;
    return headerContainer;

};
_prototype$2.syncCursor = function syncCursor() {

    var cursor = this.cursor;
    if (!cursor) {
        return;
    }
    var domCache = this.domCache;
    var rowsTop = domCache.rowsTop,
        rowsHeight = domCache.rowsHeight,
        colsLeft = domCache.colsLeft,
        colsWidth = domCache.colsWidth;
    var curTop = rowsTop[rowsTop.length - 1] + rowsHeight[rowsHeight.length - 1],
        curWidth = colsLeft[colsLeft.length - 1] + colsWidth[colsWidth.length - 1];

    style(cursor, {
        width: curWidth + 'px',
        top: curTop + 'px'
    });
    this.computeScrollbarState();
    var key = this._id + 'resizeScrollbar';
    executeFunctionDelay(key, this.resizeScrollbar, this);

};
_prototype$2.getGlobalMinWidth = function () {

    var cellsInstance = this.cellsInstance,
        config = cellsInstance.config;
    return parseInt(config.minCellWidth);

};
_prototype$2.getGlobalMinHeight = function () {

    var cellsInstance = this.cellsInstance,
        config = cellsInstance.config;
    return parseInt(config.minCellHeight);

};
_prototype$2.getMinCellWidth = function (col) {

    var cellsInstance = this.cellsInstance,
        cellsModel = cellsInstance.cellsModel;
    var field = cellsModel.header.fields[col];
    return field && field.minWidth || this.getGlobalMinWidth();

};
_prototype$2.getMinCellHeight = function (rowIndex) {

    var cellsInstance = this.cellsInstance,
        cellsModel = cellsInstance.cellsModel;
    if (rowIndex === -1) {
        return cellsModel.header.minHeight || this.getGlobalMinHeight();
    }
    var row = cellsModel.rows[rowIndex];
    return row && row.minHeight || this.getGlobalMinHeight();

};
_prototype$2._initCellSizeIndex = function () {

    this._initCellWidthIndex();
    this._initCellHeightIndex();

};
function isNum(v){
    return !isNaN(v) && typeof v === 'number';
}
_prototype$2._initHeaderFieldsWidth = function(){
    var cellsModel = this.cellsInstance.cellsModel;
    var fixedFields = [],autoFields = [];
    var panelSize = this.getPanelSize();
    var totalWidth = panelSize.width;
    cellsModel.header.fields.filter(function(field,index){
        var maxWidth = field.maxWidth,minWidth = this.getMinCellWidth(index);
        maxWidth = parseFloat(maxWidth),minWidth = parseFloat(minWidth);
        field.maxWidth = maxWidth;
        field.minWidth = minWidth;
        if(field.width){
            var width = this._parseCellWidth(field.width);
            if(maxWidth){
                width = Math.min(maxWidth,width);
            }
            if(minWidth){
                width = Math.max(minWidth,width,0);
            }
            field._width = width;
            fixedFields.push(field);
            totalWidth -= width;
        }else{
            if(isNum(maxWidth) && isNum(minWidth) && maxWidth === minWidth) {
                field._width = maxWidth;
                fixedFields.push(field);
                totalWidth -= maxWidth;
            }else{
                autoFields.push(field);
            }
        }

    }.bind(this));

    var avgWidth = Math.round(totalWidth / (autoFields.length || 1));
    autoFields.forEach(function(field){
        var width = avgWidth;
        width = Math.min(width,totalWidth);
        field._width = width;
        totalWidth -= width;
    });
    var consumeWidth = function(width){
        var noConsumer = true;
        autoFields.forEach(function(field){
            var maxWidth = field.maxWidth;
            if(isNum(maxWidth) && field._width - maxWidth >= 0){
                return;
            }
            noConsumer = false;
            field._width += 1;
            width--;
        });
        if(!noConsumer && width > 0){
            consumeWidth(width);
        }
        return width;
    };
    var produceWidth = function(width){
        var noProducer = true;
        autoFields.forEach(function(field){
            var minWidth = field.minWidth;
            if(isNum(minWidth) && field._width - minWidth <= 0){
                return;
            }
            noProducer = false;
            field._width -= 1;
            width--;
        });
        if(!noProducer && width > 0){
            produceWidth(width);
        }
        return width;
    };
    autoFields.some(function(field){
        var minWidth = field.minWidth,maxWidth = field.maxWidth;
        var width = field._width;
        if(width < minWidth){
            produceWidth(minWidth - width);
            field._width = minWidth;
            return;
        }
        if(width > maxWidth){
            consumeWidth(width - maxWidth);
            field._width = maxWidth;
            return;
        }
    });
};
_prototype$2._initCellWidthIndex = function () {

    var cellsModel = this.cellsInstance.cellsModel,
        colsWidth = this.domCache.colsWidth,
        colsLeft = this.domCache.colsLeft;

    this._initHeaderFieldsWidth();

    var maxWidth = 0;
    cellsModel.header.fields.forEach(function (field, index) {
        var colWidth = field._width;
        colsWidth[index] = colWidth;
        maxWidth += colWidth;
        if (index === 0) {
            colsLeft[index] = 0;
        } else {
            colsLeft[index] = colsLeft[index - 1] + colsWidth[index - 1];
        }

    }.bind(this));

};
_prototype$2._initCellHeightIndex = function () {

    var domCache = this.domCache,
        cellsInstance = this.cellsInstance,
        cellsModel = cellsInstance.cellsModel;

    var headerHeight = this._parseCellHeight(cellsModel.header.height);
    headerHeight = Math.max(headerHeight, this.getMinCellHeight(-1));
    domCache.headerHeight = headerHeight;

    this._initBodyCellHeightIndex();

};
_prototype$2._initBodyCellHeightIndex = function (startIndex) {
    var domCache = this.domCache,
        cellsInstance = this.cellsInstance,
        cellsModel = cellsInstance.cellsModel;
    startIndex = startIndex || 0;
    var rows = cellsModel.rows;
    var rowsTop = domCache.rowsTop,
        rowsHeight = domCache.rowsHeight;

    //create page cursor
    rows.slice(startIndex).forEach(function (row, index) {
        index += startIndex;
        var rowHeight = this._parseCellHeight(row.height);
        rowHeight = Math.max(rowHeight, this.getMinCellHeight(index));
        rowsHeight[index] = rowHeight;
        if (index === 0) {
            rowsTop[index] = 0;
        } else {
            rowsTop[index] = rowsTop[index - 1] + rowsHeight[index - 1];
        }
    }.bind(this));
};
_prototype$2._parseCellWidth = function (width) {

    var panelSize = this.getPanelSize();
    var clientWidth = panelSize.width;
    if (typeof width === 'string' && width && width.indexOf('%') === width.length - 1) {
        width = Math.floor(parseFloat(width) / 100 * clientWidth);
    } else {
        width = parseInt(width);
    }
    return isNaN(width) ? 100 : width;

};
_prototype$2._parseCellHeight = function (height) {

    if (typeof height === 'string' && height && height.indexOf('%') === height.length - 1) {
        var clientHeight = this.getPanelSize().height;
        height = Math.floor(parseFloat(height) / 100 * clientHeight);
    } else {
        height = parseInt(height);
    }
    return height ? height : 30;

};
_prototype$2._onAppendRows = function () {

    var rowsHeight = this.domCache.rowsHeight;
    this._initBodyCellHeightIndex(rowsHeight.length);
    this.syncCursor();
    var key = this._id + 'repaintRequest';
    executeFunctionDelay(key, this.repaint, this);

};
_prototype$2._bindCellsModelEvent = function () {

    var cellsInstance = this.cellsInstance;
    cellsInstance.cellsModel.bind('refresh', function () {
        var key = this._id + 'refresh';
        if (cellsInstance.renderTo) {
            executeFunctionDelay(key, this.repaint, this);
        }
    }.bind(this));

    cellsInstance.cellsModel.bind('appendRows', function () {
        var key = this._id + 'appendRows';
        if (cellsInstance.renderTo) {
            executeFunctionDelay(key, this._onAppendRows, this);
        }
    }.bind(this));
};

_prototype$2.tiggerCellEvent = function tiggerCellEvent(cell,eventName,origin) {

    var cellsInstance = this.cellsInstance;
    var cellsModel = cellsInstance.cellsModel,
        cellsEvent = cellsInstance.cellsEvent,
        col = parseInt(cell.getAttribute('col'));
    if (cell._headerCell) {
        cellsEvent.triggerEvent(CellsEvent.createEvent(eventName, cell, cellsModel.header.fields[col],origin));
        return;
    }
    var row = parseInt(cell.getAttribute('row'));
    var rowData = cellsModel.rows[row];
    if (rowData) {
        cellsEvent.triggerEvent(CellsEvent.createEvent(eventName, cell, rowData.fields[col],origin));
    }
};
function _bindScrollEvent() {

    var cellsInstance = this.cellsInstance,
        cellsEvent = cellsInstance.cellsEvent;
    var headerPanel = this.headerPanel,
        scrollbar = this.scrollbar;
    var headerContentPanel = headerPanel._contentPanel;
    scrollbar.addEventListener('scroll', function (e) {

        var scrollLeft = scrollbar.scrollLeft;
        style(headerContentPanel, 'left', -scrollLeft + 'px');
        var key = this._id + 'repaintRequest';
        executeFunctionDelay(key, this.repaint, this);

        var event = CellsEvent.createEvent('scroll', scrollbar, cellsInstance.cellsModel,e);
        cellsEvent.triggerEvent(event);

    }.bind(this));
}
function getCellTarget(panel,target){
    if(target === panel){
        return null;
    }
    if (target._cell) {
        return target;
    } else {
        while (target = target.parentNode) {
            if (target === panel) {
                break;
            }
            if (target._cell) {
                return target;
            }
        }
    }
    return null;
}
function _bindClickEvent() {

    var cellsInstance = this.cellsInstance,
        cellsEvent = cellsInstance.cellsEvent;
    var _ = this, cellsPanel = this.cellsPanel;
    cellsPanel.addEventListener('click', function (e) {

        var target = e.target;
        if (target === cellsPanel) {
            cellsEvent.triggerEvent(CellsEvent.createEvent('click', cellsPanel, cellsInstance.cellsModel,e));
            return;
        }
        if (cellsEvent.existEventListener('cellClick')) {

            var cell = getCellTarget(cellsPanel,target);
            if(cell){
                _.tiggerCellEvent(cell,'cellClick',e);
            }
        }
        cellsEvent.triggerEvent(CellsEvent.createEvent('click', cellsPanel, cellsInstance.cellsModel,e));
    });

}
function _bindContextMenuEvent() {

    var cellsInstance = this.cellsInstance,
        cellsEvent = cellsInstance.cellsEvent;
    var _ = this, cellsPanel = this.cellsPanel;
    cellsPanel.addEventListener('contextmenu', function (e) {

        var target = e.target;
        if (target === cellsPanel) {
            cellsEvent.triggerEvent(CellsEvent.createEvent('contextMenu', cellsPanel, cellsInstance.cellsModel,e));
            return;
        }
        if (cellsEvent.existEventListener('cellContextMenu')) {

            var cell = getCellTarget(cellsPanel,target);
            if(cell){
                _.tiggerCellEvent(cell,'cellContextMenu',e);
            }
        }
        cellsEvent.triggerEvent(CellsEvent.createEvent('contextMenu', cellsPanel, cellsInstance.cellsModel,e));
    });

}
_prototype$2.bindEvent = function () {
    _bindScrollEvent.call(this);
    _bindClickEvent.call(this);
    _bindContextMenuEvent.call(this);
};
_prototype$2.render = function render() {

    initRender.apply(this);

    this._initPanelSize();
    this._initCellSizeIndex();
    this.headerHeight(this.domCache.headerHeight);
    this.executePaint();
    this.syncCursor();

    this.cellsInstance.triggerEvent(CellsEvent.createEvent('renderFinished', this));

};
_prototype$2.paint = function paint() {

    var domCache = this.domCache;
    this.initPaint();
    this._initPanelSize();
    this._initCellSizeIndex();
    this.headerHeight(domCache.headerHeight);
    this.executePaint();
    this.syncCursor();

};
_prototype$2.repaint = function repaint() {

    this.executePaint();

};
_prototype$2.headerHeight = function (height) {

    var domCache = this.domCache;

    if (!height) {
        return domCache.headerHeight;
    }
    height = parseInt(height);
    if (typeof height !== 'number') {
        return;
    }
    domCache.headerHeight = height;
    height = height + 'px';
    this.headerPanel.style.height = height;
    this.cellsPanel.style.paddingTop = height;
};
_prototype$2.scrollTo = function (scrollTop, scrollLeft) {

    var scrollbar = this.scrollbar;

    if (arguments.length === 0) {
        return {
            scrollLeft: scrollbar.scrollLeft,
            scrollTop: scrollbar.scrollTop
        };
    }
    scrollbar.scrollLeft = scrollLeft;
    scrollbar.scrollTop = scrollTop;

};
CellsRender.addInitHooks(function () {
    this._bindCellsModelEvent();
});
Cells.publishMethod(['render', 'paint', 'repaint', 'scrollTo', 'headerHeight'], 'cellsRender');
Cells.addInitHooks(function () {
    this.cellsRender = new CellsRender(this);
});

var CellsResize = Class.create(function (cellsInstance) {

    this.cellsInstance = cellsInstance;

});
var _prototype$4 = CellsResize.prototype;
function isNumber(value){

    return typeof value === 'number';

}
_prototype$4._updateRowDomCache = function (rowIndex,height) {

    if(!isNumber(rowIndex = parseFloat(rowIndex)) || !isNumber(height = parseFloat(height))){
        return;
    }
    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender,
        domCache = cellsRender.domCache;
    height = Math.max(cellsRender.getMinCellHeight(rowIndex),height);
    if(rowIndex === -1){
        domCache.headerHeight = height;
        return;
    }

    var rowsHeight = domCache.rowsHeight,
        rowsTop = domCache.rowsTop;
    rowsHeight[rowIndex] = height;
    for(var i = rowIndex + 1;i < rowsTop.length;i++){
        rowsTop[i] = rowsTop[i - 1] + rowsHeight[i - 1];
    }
};
_prototype$4._updateColDomCache = function (colIndex,width) {

    if(!isNumber(colIndex = parseFloat(colIndex)) || !isNumber(width = parseFloat(width))){
        return;
    }
    if(colIndex < 0){
        return;
    }
    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender;
    var domCache = cellsRender.domCache;


    width = Math.max(cellsRender.getMinCellWidth(colIndex),width);
    var colsWidth = domCache.colsWidth,
        colsLeft = domCache.colsLeft;
    colsWidth[colIndex] = width;
    for(var i = colIndex + 1;i < colsLeft.length;i++){
        colsLeft[i] = colsLeft[i - 1] + colsWidth[i - 1];
    }

};
_prototype$4._updateDomCache = function (rowIndex,colIndex,width,height) {

    this._updateRowDomCache(rowIndex,height);
    this._updateColDomCache(colIndex,width);

};
_prototype$4.resizeRowHeight = function resizeRowHeight(rowIndex,height) {

    this.resizeCell(rowIndex,null,null,height);

};
_prototype$4.resizeColWidth = function resizeColWidth(colIndex,width) {

    this.resizeCell(null,colIndex,width,null);

};

_prototype$4._resizeCellDom = function _resizeCellDom(rowIndex,colIndex) {

    this._updateHeaderCells(colIndex,{
        row:rowIndex === -1,
        col:colIndex >= 0
    });

    this._updateBodyCells(rowIndex,colIndex,{
        row:rowIndex >= 0,
        col:colIndex >= 0
    });

    this._updateFreezeCells(rowIndex,colIndex,{
        row:rowIndex >= 0,
        col:colIndex >= 0
    });
};
_prototype$4._updateBodyCells = function (rowIndex,colIndex,option) {
    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender;
    this._updateContentCells(cellsRender.getBodyCells(),rowIndex,colIndex,option);
};
_prototype$4._updateFreezeCells = function (rowIndex,colIndex,option) {
    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender;
    this._updateContentCells(cellsRender.getFreezeCells(),rowIndex,colIndex,option);
};
_prototype$4._updateContentCells = function (cells,rowIndex,colIndex,option) {

    var option = option || {
            row:false,
            col:false
        };
    if(!option.col && !option.row){
        return;
    }
    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender;
    var domCache = cellsRender.domCache,
        rowsHeight = domCache.rowsHeight,
        rowsTop = domCache.rowsTop;
    var colsWidth = domCache.colsWidth,
        colsLeft = domCache.colsLeft;
    var size = cells.length,
        cell,row,col;
    for(var i = 0;i < size;i++){
        cell = cells[i];

        if(option.row){
            row = parseInt(cell.getAttribute('row'));
            if(row === rowIndex){
                cell.style.height = rowsHeight[row] + 'px';
            }else if(row > rowIndex){
                cell.style.top = rowsTop[row] + 'px';
            }
        }

        if(option.col){
            col = parseInt(cell.getAttribute('col'));
            if(col === colIndex){
                cell.style.width = colsWidth[col] + 'px';
            }else if(col > colIndex){
                cell.style.left = colsLeft[col] + 'px';
            }
        }
    }

};
_prototype$4._updateHeaderCells = function (colIndex,option) {

    var option = option || {
            row:false,
            col:false
        };

    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender,
        domCache = cellsRender.domCache;

    if(option.row){
        cellsInstance.headerHeight(domCache.headerHeight);
    }
    if(option.col){
        var colsWidth = domCache.colsWidth,
            colsLeft = domCache.colsLeft;
        //update header col width
        var cells = cellsRender.getHeaderCells(),
            size = cells.length;

        var cell,col;
        for(var i = 0;i < size;i++){
            cell = cells[i];
            col = parseInt(cell.getAttribute('col'));
            if(col === colIndex){
                cell.style.width = colsWidth[col] + 'px';
            }else if(col > colIndex){
                cell.style.left = colsLeft[col] + 'px';
            }
        }
    }
};
_prototype$4.resizeCell = function resizeCell(rowIndex,colIndex,width,height) {

    this._updateDomCache(rowIndex,colIndex,width,height);
    this._resizeCellDom(rowIndex,colIndex,width,height);

};
var mouseHit = 3;
var cursors = ['auto','ns-resize','ew-resize','nwse-resize'];
function _bindResizeCellEvent() {

    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender;
    var domCache = cellsRender.domCache,
        cellsPanel = cellsRender.cellsPanel,
        rowsTop = domCache.rowsTop,
        colsLeft = domCache.colsLeft,
        rowsHeight = domCache.rowsHeight,
        colsWidth = domCache.colsWidth;

    var _ = this;
    function getMouseInfo(e){

        var colResize = cellsInstance.config.colResize,
            rowResize = cellsInstance.config.rowResize;

        var freezeConfig = cellsInstance.config.freezeConfig,
            freezeRow = freezeConfig.row,
            freezeCol = freezeConfig.col;

        var headerResize = cellsInstance.config.headerResize;

        var position = getMousePosition(e,cellsPanel);

        var scrollTo = cellsRender.scrollTo();
        var headerHeight = cellsInstance.headerHeight();

        var rowHit = 0,colHit = 0,rowIndex = undefined,colIndex = undefined;

        var loop = function(){ return {} };
        var getRowHitConfig = loop;
        if(rowResize){
            getRowHitConfig = function(scrollTop,freezeRow){
                var relY = position.pageY;
                var rowHit = 0,rowIndex = undefined;
                var freeze = false;

                var isFreezeRow = typeof freezeRow === 'number' && freezeRow > 0;
                if(headerResize && Math.abs(relY - headerHeight) < mouseHit){
                    rowHit = 1;
                    rowIndex = -1;
                }else if(headerHeight > relY){
                }else{
                    relY -= headerHeight;
                    if(isFreezeRow){
                        var top = rowsTop[freezeRow - 1] + rowsHeight[freezeRow - 1];
                        freeze = (top + mouseHit >= relY);
                    }
                    (!isFreezeRow || (freeze  && freezeConfig.rowResize)) && rowsTop.some(function (rowTop,index) {
                        if(index >= freezeRow){
                            return true;
                        }
                        var h = rowsHeight[index];
                        if(Math.abs(rowTop + h - scrollTop - relY) < mouseHit){
                            rowHit = 1;
                            rowIndex = index;
                            return true;
                        }
                    });
                }
                return {
                    freeze:freeze,
                    rowHit:rowHit,
                    rowIndex:rowIndex
                };
            };
        }


        var getColHitConfig = loop;
        if(colResize){
            getColHitConfig = function(scrollLeft,freezeCol){
                var isFreezeCol = typeof freezeCol === 'number' && freezeCol > 0;
                var relX = position.pageX;
                var colHit = 0,colIndex = undefined;
                var freeze = false;
                if(isFreezeCol){
                    var left = colsLeft[freezeCol - 1] + colsWidth[freezeCol - 1];
                    freeze = (left + mouseHit >= relX);
                }
                (!isFreezeCol || (freeze && freezeConfig.colResize)) && colsLeft.some(function (colLeft,index) {
                    if(index >= freezeCol){
                        return true;
                    }
                    var w = colsWidth[index];
                    if(Math.abs(colLeft + w - scrollLeft - relX) < mouseHit){
                        colHit = 2;
                        colIndex = index;
                        return true;
                    }
                });
                return {
                    freeze:freeze,
                    colHit:colHit,
                    colIndex:colIndex
                };
            };
        }

        //header area
        if(rowResize){
            var rowHitConfig;
            if(freezeRow > 0){
                rowHitConfig = getRowHitConfig(0,freezeRow);
            }
            if(!rowHitConfig || (!rowHitConfig.freeze && rowHitConfig.rowIndex === undefined)){
                rowHitConfig = getRowHitConfig(scrollTo.scrollTop);
            }
            rowHit = rowHitConfig.rowHit;
            rowIndex = rowHitConfig.rowIndex;
        }

        if(colResize){
            var colHitConfig;
            if(freezeCol > 0){
                colHitConfig = getColHitConfig(0,freezeCol);
            }
            if(!colHitConfig || (!colHitConfig.freeze && colHitConfig.colIndex === undefined)){
                colHitConfig = getColHitConfig(scrollTo.scrollLeft);
            }
            colHit = colHitConfig.colHit;
            colIndex = colHitConfig.colIndex;
        }

        var cursor = cursors[rowHit + colHit];
        return {
            cursor:cursor,
            position:position,
            rowIndex:rowIndex,
            colIndex:colIndex

        };
    }
    var resizeManager = {
        lastPageX:undefined,
        lastPageY:undefined,
        rowIndex:undefined,
        colIndex:undefined,
        reset: function () {
            var resetX = this.resetX(),
                resetY = this.resetY();
            return resetX || resetY;
        },
        resetX: function () {
            var bln = !!this.colIndex || !!this.lastPageX;
            this.lastPageX = this.colIndex = undefined;
            return bln;
        },
        resetY: function () {
            var bln = !!this.rowIndex || !!this.lastPageY;
            this.lastPageY = this.rowIndex  = undefined;
            return bln;
        }
    };
    var id = this._id;
    cellsPanel.addEventListener('mousemove', function (e) {
        var key = id + 'rowPanel-mousemove';
        executeFunctionDelay(key,function () {
            var mouseInfo = getMouseInfo(e);
            cellsPanel.style.cursor = mouseInfo.cursor;
        });

    }.bind(this));

    cellsPanel.addEventListener('mousemove', function (e) {

        var cellsInstance = this.cellsInstance;
        var cellsEvent = cellsInstance.cellsEvent,
            cellsPanel = cellsInstance.cellsPanel;
        var mouseInfo = getMouseInfo(e);
        //resizeCell
        var rowIndex = resizeManager.rowIndex,
            colIndex = resizeManager.colIndex,
            width,height,
            resizeFlag = false;
        if(resizeManager.lastPageY  !== undefined){
            height = mouseInfo.position.pageY - resizeManager.lastPageY + (rowIndex === -1 ? cellsInstance.headerHeight() : rowsHeight[rowIndex]);
            resizeManager.lastPageY = mouseInfo.position.pageY;
            resizeFlag = true;
        }

        if(resizeManager.lastPageX !== undefined){
            width = mouseInfo.position.pageX - resizeManager.lastPageX + colsWidth[colIndex];
            resizeManager.lastPageX = mouseInfo.position.pageX;
            resizeFlag = true;
        }
        if(resizeFlag){
            var event = CellsEvent.createEvent('cellResize', cellsPanel, {
                rowIndex:rowIndex,
                colIndex:colIndex,
                width:width,
                height:height
            },e);
            this.resizeCell(rowIndex,colIndex,width,height);
            cellsEvent.triggerEvent(event);
            e.stopPropagation();
        }
    }.bind(this));


    cellsPanel.addEventListener('mousedown', function (e) {

        var mouseInfo = getMouseInfo(e),
            resizeFlag = false;
        if(mouseInfo.rowIndex !== undefined){
            resizeManager.lastPageY = mouseInfo.position.pageY;
            resizeManager.rowIndex = mouseInfo.rowIndex;
            resizeFlag = true;
        }else{
            resizeManager.resetY();
        }
        if(mouseInfo.colIndex !== undefined){
            resizeManager.lastPageX = mouseInfo.position.pageX;
            resizeManager.colIndex = mouseInfo.colIndex;
            resizeFlag = true;
        }else{
            resizeManager.resetX();
        }
        if(resizeFlag){
            userSelect(false,cellsPanel);
        }

    }.bind(this));
    function mouseup(){
        userSelect(true,cellsPanel);
        if(resizeManager.reset()){
            cellsRender.syncCursor();
        }
    }
    cellsPanel.addEventListener('mouseup',mouseup.bind(this));
    cellsPanel.addEventListener('mouseleave',mouseup.bind(this));

}
_prototype$4.bindEvent = function () {
    _bindResizeCellEvent.call(this);
};
Cells.addInitHooks(function () {
    this.cellsResize = new CellsResize(this);
    this.addEventListener('renderFinished', function () {
        this.cellsResize.bindEvent();
    }.bind(this));
});

exports.global = global;
exports.Class = Class;
exports.ScrollBar = ScrollBar;
exports.CellsModel = CellsModel;
exports.Cells = Cells;
exports.CellsEvent = CellsEvent;
exports.CellsRender = CellsRender;
exports.CellsResize = CellsResize;

Object.defineProperty(exports, '__esModule', { value: true });

})));
