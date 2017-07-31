import { style,userSelect,getFullClassName,getFullClassSelector,isElementInDom,isTouchSupported,getMousePosition,isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay,executeFunctionTimeout } from './domUtil'
import { ScrollConfig } from './ScrollConfig.js';
var scrollbarId = 1;
function ScrollBar(ele,config){
    this._id = '_id' + scrollbarId++;
    this.init(ele,config);
}
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
        },true)
    }
};
function getWidth(ele){
    var style = window.getComputedStyle(ele);
    var value = 0;
    ['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth','width'].forEach(function (key) {
        value += (parseFloat(style[key]) || 0);
    });
    return value;
}
function getClientWidth(ele){
    return ele.clientWidth;
}
function getScrollWidth(element){
    var children = element.children;
    var length = children.length,width = 0,ele;
    if(length > 0){
        for(var i = 0;i < length;i++){
            ele = children[i];
            if(ele.vScrollbar || ele.hScrollbar){
                continue;
            }
            width += Math.max(ele.scrollWidth,ele.offsetWidth);
        }
    }
    return Math.max(element.scrollWidth,element.clientWidth,width);
}
function getHeight(ele){
    var style = window.getComputedStyle(ele);
    var value = 0;
    ['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth','height'].forEach(function (key) {
        value += (parseFloat(style[key]) || 0);
    });
    return value;
}
function getClientHeight(ele){
    return ele.clientHeight;
}
function getScrollHeight(element){
    var children = element.children;
    var length = children.length,height = 0,ele;
    if(length > 0){
        for(var i = 0;i < length;i++){
            ele = children[i];
            if(ele.vScrollbar || ele.hScrollbar){
                continue;
            }
            height += Math.max(ele.scrollHeight,ele.offsetHeight);
        }
    }
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

    this.initScrollSize(['width','height'])

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
        this.triggerEvent('scroll');
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
ScrollBar.prototype.triggerEvent = function (eventType) {

    var listeners = this.eventListeners[eventType];
    if(!listeners){
        return;
    }
    listeners.forEach(function (listener) {
        try{
            listener.call(this);
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
        if(ele.vScrollbar || ele.hScrollbar || ele.scrollCross){
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
    executeFunctionTimeout('hidden-v-scrollbar', function () {
        this.hScrollbar.setAttribute(attrName,'');
        this.vScrollbar.setAttribute(attrName,'');
    },1000,this);
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

}

export { ScrollBar }