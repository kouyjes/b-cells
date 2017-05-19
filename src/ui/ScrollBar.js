import { isElementInDom,getMousePosition,isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'
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
function getScrollWidth(ele){
    return ele.scrollWidth;
}
function getHeight(ele){
    return ele.clientHeight;
}
function getScrollHeight(ele){
    return ele.scrollHeight;
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
    this.scrollWidth = 0;
    this.clientWidth = 0;
    this.scrollHeight = 0;
    this.clientHeight = 0;


    this._scrollTop = 0;
    this._scrollLeft = 0;
    var _ = this;
    Object.defineProperty(this,'scrollTop',{
        set: function (val) {
            _.scrollTopTo(val);
        },
        get: function () {
            return _.getScrollTop();
        }
    });
    Object.defineProperty(this,'scrollLeft',{
        set: function (val) {
            _.scrollLeftTo(val);
        },
        get: function () {
            return _.getScrollLeft();
        }
    });

    this.config = Object.assign({
        overflowX:false,
        overflowY:false,
        width:18,
        hTrackColor:'#e4f0e2',
        hScrollColor:'#ddd',
        vTrackColor:'#e4f0e2',
        vScrollColor:'#ddd',
        height:18
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

    this.updateScrollSize();
    this._renderV();
    this._renderH();

    this._bindHorEvent();
    this._bindVerEvent();
    this._bindMouseWheelEvent();

};
ScrollBar.prototype.triggerScrollEvent = function () {

    var scrollEvtKey = this._id + 'scroll';
    executeFunctionDelay(scrollEvtKey, function () {
        this.triggerEvent('scroll');
    },this);

};
ScrollBar.prototype.resize = function () {

    this.updateScrollSize();
    var bar,left,top,ratio,barHidden = true;
    if(this.hScrollbar){
        ratio = this.getHScrollRatio();
        left = this.scrollLeft / ratio;
        bar = this.hScrollbar.children[0];
        var barWidth = this.getScrollbarWidth();
        barHidden = this.scrollWidth - this.config.width <= this.clientWidth;
        style(bar,{
            left:left + 'px',
            width:barWidth + 'px'
        });

        style(this.hScrollbar,{
            display:this.config.overflowX || barHidden ? 'none' : 'block'
        });
    }

    if(this.vScrollbar){
        ratio = this.getVScrollRatio();
        top = this.scrollTop / ratio;
        bar = this.vScrollbar.children[0];
        var barHeight = this.getScrollbarHeight();
        barHidden = this.scrollHeight - this.config.height <= this.clientHeight;
        style(bar,{
            top:top + 'px',
            height:barHeight + 'px'
        });

        style(this.vScrollbar,{
            display:this.config.overflowY || barHidden ? 'none' : 'block'
        });
    }
};
ScrollBar.prototype.refresh = function () {
    this.scrollLeft = this.scrollLeft;
    this.scrollTop = this.scrollTop;
};
ScrollBar.prototype.updateScrollSize = function () {

    var width = getWidth(this.element),scrollWidth = getScrollWidth(this.element.children[0]);
    scrollWidth = Math.max(width,scrollWidth) + this.config.width;
    this.clientWidth = width;

    var height = getHeight(this.element),scrollHeight = getScrollHeight(this.element.children[0]);
    scrollHeight = Math.max(height,scrollHeight);
    this.clientHeight = height;

    if(this.config.overflowY && scrollWidth > width){
        scrollHeight += this.config.height;;
    }
    if(this.config.overflowX && scrollHeight > height){
        scrollWidth += this.config.width;;
    }
    this.scrollWidth = scrollWidth;
    this.scrollHeight = scrollHeight;
};
ScrollBar.prototype._createScrollBarBlock = function () {

    var bar = document.createElement('div');
    bar.className = 'scrollbar-block'
    return bar;

};
ScrollBar.prototype._renderH = function () {

    var dom = document.createElement('div');
    this.hScrollbar = dom;
    dom.className = 'scrollbar-hor';
    style(dom,{
        height:this.config.height + 'px',
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
    };

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
ScrollBar.prototype.getScrollLeft = function () {

    var maxScrollLeft = this.scrollWidth - this.clientWidth;
    this._scrollLeft = Math.min(maxScrollLeft,this._scrollLeft);
    this._scrollLeft = Math.max(0,this._scrollLeft);
    return this._scrollLeft;

};
ScrollBar.prototype.scrollLeftTo = function (scrollLeft) {

    var maxScrollLeft = this.scrollWidth - this.clientWidth;
    scrollLeft = Math.min(maxScrollLeft,scrollLeft);
    scrollLeft = Math.max(0,scrollLeft);
    var scrollRatio = this.getHScrollRatio();
    var barLeft = scrollLeft / scrollRatio;
    var bar = this.hScrollbar.children[0];
    style(bar,{
        left:barLeft + 'px'
    });
    this._scrollLeft = scrollLeft;
    style(this.element.children[0],{
        left: -scrollLeft + 'px'
    });
    this.triggerScrollEvent();

};
ScrollBar.prototype.getScrollTop = function () {

    var maxScrollTop = this.scrollHeight - this.clientHeight;
    this._scrollTop = Math.min(maxScrollTop,this._scrollTop);
    this._scrollTop = Math.max(0,this._scrollTop);
    return this._scrollTop;

};
ScrollBar.prototype.scrollTopTo = function (scrollTop) {

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
    style(this.element.children[0],{
        top:-scrollTop + 'px'
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
    };
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
    this.vScrollbar = dom;
    dom.className = 'scrollbar-ver';
    style(dom,{
        width:this.config.width + 'px',
        'background-color':this.config.vTrackColor
    });

    var bar = this._createScrollBarBlock();
    style(bar,{
        'background-color':this.config.vScrollColor
    });

    dom.appendChild(bar);
    this.element.appendChild(dom);

    this._bindVerEvent();

}

export { ScrollBar }