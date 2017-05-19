import { isElementInDom,isTouchSupported,getMousePosition,isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'
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
            width += Math.max(ele.scrollWidth,ele.clientWidth);
        }
    }
    return Math.max(element.scrollWidth,element.clientWidth,width);

}
function getHeight(ele){
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
            height += Math.max(ele.scrollHeight,ele.clientHeight);
        }
    }
    return Math.max(element.scrollHeight,element.clientHeight,height);

}
function style(ele,style){
    Object.keys(style).forEach(function (key) {
        ele.style[key] = style[key];
    });
}
function disableUserSelect(){
    style(document.body,{
        '-webkit-user-select':'none'
    });
}
function enableUserSelect(){
    style(document.body,{
        '-webkit-user-select':'inherit'
    });
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
    this.overflowX = true;
    this.overflowY = true;
    this.config = Object.assign({
        overflowX:false,
        overflowY:false,
        width:12,
        hTrackColor:'#e4f0e2',
        hScrollColor:'#ddd',
        vTrackColor:'#e4f0e2',
        vScrollColor:'#ddd',
        height:12
    },config);

    this.eventListeners = {};

    this.vScrollbar = null;
    this.hScrollbar = null;

    ScrollBar.initEventListeners();

    this.initUI();

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

        var clientWidth = this.vScrollbar.clientWidth;
        this.config.width = Math.max(clientWidth,this.config.width);

        var clientHeight = this.hScrollbar.clientHeight;
        this.config.height = Math.max(clientHeight,this.config.height);

    },this);

};
ScrollBar.prototype.triggerScrollEvent = function () {

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
            display:this.config.overflowX || this.overflowX ? 'none' : 'block'
        });
    }

    if(this.vScrollbar){
        bar = this.vScrollbar.children[0];
        var barHeight = this.getScrollbarHeight();
        style(bar,{
            height:barHeight + 'px'
        });

        style(this.vScrollbar,{
            display:this.config.overflowY || this.overflowY ? 'none' : 'block'
        });
    }

    this.refresh();
};
ScrollBar.prototype.refresh = function () {

    this.scrollLeft = this.scrollLeft;
    this.scrollTop = this.scrollTop;

};
ScrollBar.prototype.updateScrollSize = function () {

    var clientWidth = getWidth(this.element),scrollWidth = getScrollWidth(this.element);

    var clientHeight = getHeight(this.element),scrollHeight = getScrollHeight(this.element);

    this.overflowX = scrollWidth <= clientWidth;
    this.overflowY = scrollHeight <= clientHeight;

    this.clientWidth = clientWidth;
    this.clientHeight = clientHeight;
    this.scrollWidth = scrollWidth;
    this.scrollHeight = scrollHeight;

};
ScrollBar.prototype._setScrollWidth = function (scrollWidth) {

    this._scrollWidth = scrollWidth;

};
ScrollBar.prototype._getScrollWidth = function () {

    var scrollWidth = this._scrollWidth;
    if(!this.overflowY){
        scrollWidth += this.config.width;
    }
    return scrollWidth;

};
ScrollBar.prototype._setScrollHeight = function (scrollHeight) {

    this._scrollHeight = scrollHeight;

};
ScrollBar.prototype._getScrollHeight = function () {

    var scrollHeight = this._scrollHeight;
    if(!this.overflowX){
        scrollHeight += this.config.height;
    }
    return scrollHeight;

};
ScrollBar.prototype._createScrollBarBlock = function () {

    var bar = document.createElement('div');
    bar.className = 'scrollbar-block'
    return bar;

};
ScrollBar.prototype._renderH = function () {

    var dom = document.createElement('div');
    dom.hScrollbar = true;
    this.hScrollbar = dom;
    dom.className = 'scrollbar-hor';
    style(dom,{
        height:this.config.height + 'px',
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
        }catch(e){}
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
        disableUserSelect();
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
        enableUserSelect();
        if(!isElementInDom(this.element)){
            delete ScrollBar.mousemoveListeners[eventKey];
            delete ScrollBar.mouseupListeners[eventKey];
        }
    }.bind(this);

};
ScrollBar.prototype.getHScrollRatio = function () {

    var barWidth = this.getScrollbarWidth();
    var scrollRatio = (this.scrollWidth - this.clientWidth)/(this.clientWidth - barWidth);
    return scrollRatio;

};
ScrollBar.prototype.getVScrollRatio = function () {

    var barHeight = this.getScrollbarHeight();
    var scrollRatio = (this.scrollHeight - this.clientHeight)/(this.clientHeight - barHeight);
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
ScrollBar.prototype._bindVerEvent = function () {

    var bar = this.vScrollbar.children[0];
    var startY,relativeTop;
    bar.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        var pos = getMousePosition(e);
        startY = pos.pageY;
        relativeTop = parseFloat(bar.style.top) || 0;

        disableUserSelect();
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
        enableUserSelect();
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
ScrollBar.prototype._bindMouseWheelEvent = function () {

    var _ = this;
    if(this.config.overflowY){
        return;
    }
    function wheelEvent(e){
        var length = e.wheelDelta ? e.wheelDelta / 40 : e.detail || -e.deltaY;
        _.scrollTop += -length * 5;
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
            disableUserSelect();

        };
        listeners.touchmove = function (e) {

            if(!listeners.startX || !listeners.startY){
                return;
            }
            var pos = getMousePosition(e);
            var moveRatio = 0.2;
            if(Math.abs(pos.pageY - listeners.lastPageY) >= Math.abs(pos.pageX - listeners.lastPageX)){
                _.scrollTop += -(pos.pageY - listeners.startY) * moveRatio;
            }else{
                _.scrollLeft += -(pos.pageX - listeners.startX) * moveRatio;
            }

            listeners.lastPageY = pos.pageY;
            listeners.lastPageX = pos.pageX;
        };
        listeners.touchend = function () {

            listeners.destroy();
            enableUserSelect();

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
    this.vScrollbar = dom;
    dom.className = 'scrollbar-ver';
    style(dom,{
        width:this.config.width + 'px',
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