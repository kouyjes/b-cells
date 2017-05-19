(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
   typeof define === 'function' && define.amd ? define(['exports'], factory) :
   (factory((global.CELL = global.CELL || {})));
}(this, (function (exports) { 'use strict';

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
        }catch(e) {}
    });
};
CellsModel.prototype.refresh = function () {
    this.trigger('refresh');
};
CellsModel.prototype.appendRows = function (rows) {
    this.rows = this.rows.concat(rows);
    this.trigger('appendRows');
};

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
function isElementInDom(element){
    return document.contains(element);
}

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
        },true);
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
    bar.className = 'scrollbar-block';
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
    function wheelEvent(e){
        if(_.overflowY){
            return;
        }
        var length = e.wheelDelta ? e.wheelDelta / 40 : e.detail || -e.deltaY;
        _.scrollTop += -length * 10;
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
            var moveRatio = 0.8;
            if(Math.abs(pos.pageY - listeners.lastPageY) >= Math.abs(pos.pageX - listeners.lastPageX)){
                _.scrollTop += -(pos.pageY - listeners.lastPageY) * moveRatio;
            }else{
                _.scrollLeft += -(pos.pageX - listeners.lastPageX) * moveRatio;
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

};

/**
 * Created by koujp on 2016/10/17.
 */
var headerContentClassName = 'header-content';
function Cells(cellsModel,config){

    if(!(cellsModel instanceof CellsModel)){
        throw new TypeError('arguments must be instanceof CellsModel !');
    }
    this.cellsModel = cellsModel;

    this.config = Object.assign({
        enableCustomScroll:false,
        textTitle:false,
        colResize:false,
        rowResize:false,
        overflowX:false,
        overflowY:false
    },config);

    this._bindCellsModelEvent();

}
Cells.prototype.themesPrefix = 'd1012';
Cells.prototype.init = function () {

    this.cellPanel = null;
    this.headerPanel = null;
    this.bodyPanel = null;
    this.rowPanel = null;
    this.cursor = null;
    this.scrollbar = null;

    this.rowClientArea = null;
    this.colClientArea = null;

    this.domCache = {
        headerCells:[],
        cells:[],
        colsWidth:[],
        colsLeft:[],
        rowsTop:[],
        rowsHeight:[]
    };

    Object.defineProperty(this,'eventManager',{
        value:{
            click:[], //cells click event
            cellClick:[] //cell click event
        }
    });


};
Cells.prototype.getFullClassName = function (className) {

    if(!className){
        return this.themesPrefix;
    }
    return this.themesPrefix + '-' + className;

};
Cells.prototype.getFullClassSelector = function (selector) {

    return '.' + this.getFullClassName(selector);

};
Cells.prototype.addEventListener = function (eventType,func) {

    var handlers = this.eventManager[eventType];
    if(!handlers){
        handlers = this.eventManager[eventType] = [];
    }
    if(handlers.indexOf(func) === -1){
        handlers.push(func);
    }
};
Cells.prototype.removeEventListener = function (eventType,func) {

    var handlers = this.eventManager[eventType];
    if(!handlers){
        return;
    }
    var index = handlers.indexOf(func);
    if(index >= 0){
        handlers.splice(index,1);
    }

};
Cells.prototype.triggerEvent = function (event) {

    var eventType = event.type;
    var handlers = this.eventManager[eventType];
    if(!handlers){
        return;
    }
    handlers.forEach(function (handler) {
        requestAnimationFrame(function () {
            handler.call(event.target,event);
        });
    }.bind(this));

};
Cells.prototype.render = function (renderTo) {

    this._setRenderTo(renderTo);
    this.refresh();

};
Cells.prototype.refresh = function () {

    this.init();
    var renderTo = this.renderTo;
    if(!renderTo || renderTo.nodeType !== 1){
        throw new TypeError('parent container is invalid !');
    }

    var cellPanel = this.cellPanel = document.createElement('div');
    cellPanel.className = this.getFullClassName();
    var dirtyPanel = renderTo.querySelector(this.getFullClassSelector());
    dirtyPanel && renderTo.removeChild(dirtyPanel);

    cellPanel.appendChild(this._createHeader());

    cellPanel.appendChild(this._createBodyContainer());
    renderTo.appendChild(cellPanel);

    if(this.config.enableCustomScroll){
        this.scrollbar = new ScrollBar(this.bodyPanel,{
            overflowX:this.config.overflowX,
            overflowY:this.config.overflowY
        });
    }

    this._createCursor();

    this._bindEvent();

    this.executeFunctionDelay('paintRequest',this.paint);


};
Cells.prototype._setRenderTo = function (renderTo) {

    if(typeof renderTo === 'string'){
        renderTo = document.querySelector(renderTo);
    }

    if(!isDomElement(renderTo)){
        throw new TypeError('renderTo must be a dom element !');
    }

    this.renderTo = renderTo;

};
Cells.prototype.scrollTo = function (scrollTop,scrollLeft) {

    var scrollbar = this.scrollbar || this.bodyPanel;

    if(arguments.length === 0){
        return {
            scrollLeft:scrollbar.scrollLeft,
            scrollTop:scrollbar.scrollTop
        };
    }
    scrollbar.scrollLeft = scrollLeft;
    scrollbar.scrollTop = scrollTop;

};
Cells.prototype._cachePanelSize = function () {

    var renderTo = this.renderTo;

    renderTo.lastWidth = renderTo.currentWidth;
    renderTo.lastHeight = renderTo.currentHeight;

    renderTo.currentWidth = renderTo.clientWidth;
    renderTo.currentHeight = renderTo.clientHeight;

    if(!renderTo.lastWidth){
        renderTo.lastWidth = renderTo.currentWidth;
    }
    if(!renderTo.lastHeight){
        renderTo.lastHeight = renderTo.currentHeight;
    }

};
Cells.prototype.getPanelSize = function () {

    return {
        width:this.renderTo.currentWidth,
        height:this.renderTo.currentHeight
    };

};
Cells.prototype.getCurrentColArea = function () {

    var scrollbar = this.scrollbar || this.bodyPanel;
    var panelSize = this.getPanelSize();
    var colsLeft = this.domCache.colsLeft;
    var left = scrollbar.scrollLeft;
    return this.getThresholdArea(panelSize.width,colsLeft,left);

};
Cells.prototype.getThresholdArea = function (viewSize,positions,cursor) {

    var from = 0,
        end;
    positions.some(function (position,index) {
        if(position >= cursor){
            from = index;
            return true;
        }
    });
    var mid = from + 1;
    for(var i = mid;i >= 0;i--){
        if(positions[mid] - positions[i] >= viewSize){
            break;
        }
    }
    from = Math.max(0,i);
    for(var i = mid;i < positions.length;i++){
        if(positions[i] - positions[mid] > viewSize){
            break;
        }
    }
    end = Math.min(positions.length,i);
    var area = {
        from:from,
        pageSize:end - from
    };
    return area;

};
Cells.prototype.getCurrentRowArea = function () {

    var scrollbar = this.scrollbar || this.bodyPanel;
    var panelSize = this.getPanelSize();
    var rowsTop = this.domCache.rowsTop;
    var top = scrollbar.scrollTop;
    return this.getThresholdArea(panelSize.height,rowsTop,top);

};
Cells.prototype.getRowPaintAreas = function () {

    return this._getPaintAreas('row');

};
Cells.prototype.getColPaintAreas = function () {

    return this._getPaintAreas('col');

};
Cells.prototype._getPaintAreas_ = function (type) {

    var lastArea = type === 'row'?this.rowClientArea:this.colClientArea,
        curArea = type === 'row'?this.getCurrentRowArea():this.getCurrentColArea();

    var areas = [];
    areas.currentArea = curArea;

    if(lastArea == null){
        areas.push(curArea);
        return areas;
    }

    if(lastArea.from === curArea.from && lastArea.pageSize === curArea.pageSize){
        return areas;
    }
    var firstArea,secArea;
    if(lastArea.from > curArea.from){
        firstArea = curArea;
        secArea = lastArea;
    }else{
        firstArea = lastArea;
        secArea = curArea;
    }
    if(secArea.from - firstArea.from > firstArea.pageSize){
        areas.push(firstArea === curArea?firstArea:secArea);
        return areas;
    }

    if(firstArea === curArea && secArea.from - firstArea.from > 0){
        areas.push({
            from:firstArea.from,
            pageSize:secArea.from - firstArea.from
        });
    }
    if(secArea === curArea){
        areas.push({
            from:firstArea.from + firstArea.pageSize,
            pageSize:secArea.from + secArea.pageSize - (firstArea.from + firstArea.pageSize)
        });
    }
    return areas;

};
Cells.prototype._getPaintAreas = function (type) {

    var lastArea = type === 'row'?this.rowClientArea:this.colClientArea,
        curArea = type === 'row'?this.getCurrentRowArea():this.getCurrentColArea();

    var areas = [];
    areas.currentArea = curArea;

    if(lastArea == null){
        areas.push(curArea);
        return areas;
    }

    if(lastArea.from === curArea.from && lastArea.pageSize === curArea.pageSize){
        return areas;
    }

    if(curArea.from >= lastArea.from){

        if(lastArea.from + lastArea.pageSize <= curArea.from){
            areas.push(curArea);
        }else{
            areas.push({
                from:lastArea.from + lastArea.pageSize,
                pageSize:curArea.from + curArea.pageSize - (lastArea.from + lastArea.pageSize)
            });
        }

    }else{

        if(curArea.from + curArea.pageSize <= lastArea.from){
            areas.push(curArea);
        }else{
            areas.push({
                from:curArea.from,
                pageSize:lastArea.from - curArea.from
            });
            var bottomDis = curArea.from + curArea.pageSize - (lastArea.from + lastArea.pageSize);
            if(bottomDis > 0){
                areas.push({
                    from:lastArea.from + lastArea.pageSize,
                    pageSize:bottomDis
                });
            }
        }

    }
    return areas;

};
Cells.prototype.paint = function () {

    this._cachePanelSize();
    this._initCellSizeIndex();
    this.paintHeader();
    this.paintBody();
    this.syncCursor();

};
Cells.prototype.repaint = function () {

    this.paintHeader();
    this.paintBody();

};
Cells.prototype.paintHeader = function () {

    var cellsCache = this.domCache.headerCells,
        headerContentPanel = this.headerPanel.querySelector(this.getFullClassSelector(headerContentClassName));
    cellsModel.header.fields.forEach(function (field,index) {
        var headerCell = cellsCache[index];
        if(!headerCell){
            headerCell = this._createCell(0,index,field,cellsCache);
            headerCell._headerCell = true;
            headerContentPanel.appendChild(headerCell);
        }else{
            this._paintCell(headerCell,0,index,field);
        }
    }.bind(this));

};
Cells.prototype.paintBody = function () {

    var rowPaintAreas = this.getRowPaintAreas(),
        colPaintAreas = this.getColPaintAreas();

    var rowClientArea = rowPaintAreas.currentArea,
        colClientArea = colPaintAreas.currentArea;
    this.rowClientArea = rowClientArea;
    this.colClientArea = colClientArea;

    if(rowPaintAreas.length === 0 && colPaintAreas.length === 0){
        return;
    }

    if(rowPaintAreas.length === 0){
        rowPaintAreas.push(rowClientArea);
    }
    if(colPaintAreas.length === 0){
        colPaintAreas.push(colClientArea);
    }

    var cacheCells = this.domCache.cells;
    var cells = cacheCells.filter(function (cell) {
        var r = parseInt(cell.getAttribute('row')),
            col = parseInt(cell.getAttribute('col'));
        var inRow = r >= rowClientArea.from && r < rowClientArea.from + rowClientArea.pageSize,
            inCol = col >= colClientArea.from && col < colClientArea.from + colClientArea.pageSize;
        return !inRow || !inCol;
    });

    var rows = this.cellsModel.rows;

    rowPaintAreas.forEach(function (area) {
        var row;
        for(var rowIndex = area.from;rowIndex < area.from + area.pageSize;rowIndex++){

            row = rows[rowIndex];
            colPaintAreas.forEach(function (colArea) {
                var cell,field;
                for(var colIndex = colArea.from;colIndex < colArea.from + colArea.pageSize;colIndex++){
                    field = row.fields[colIndex];
                    cell = cells.pop();
                    if(!cell){
                        cell = this._createCell(rowIndex,colIndex,field);
                        this.rowPanel.appendChild(cell);
                    }else{
                        this._paintCell(cell,rowIndex,colIndex,field);
                    }
                }
            }.bind(this));
        }
    }.bind(this));
    cells.forEach(function (cell) {
        if(cell.parentNode){
            cell.parentNode.removeChild(cell);
            cacheCells.splice(cacheCells.indexOf(cell),1);
        }
    });

};
Cells.prototype.computeRowTop = function (row) {

    var rowsTop = this.domCache.rowsTop;
    return rowsTop[row];

};
Cells.prototype._paintCell = function (cell,row,col,field) {

    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
    this._configCell(cell,field);
    this._reLayoutCell(cell);

};
Cells.prototype._configCell = function (cell,field) {

    var isHtml = typeof field.html === 'string',
    isHtmlCell = cell.getAttribute('html_content') === 'true';
    cell.setAttribute('html_content',isHtml + '');
    if(isHtml){
        cell.innerHTML = field.html;
    }else{
        var text = field.name || field.value;
        var span;
        if(isHtmlCell){
            cell.innerHTML = '';
            span = document.createElement('span');
            span.innerText = text;
            cell.appendChild(span);
        }else{
            var children = cell.children;
            if(children.length > 0){
                span = children[0];
            }else{
                span = document.createElement('span');
                cell.appendChild(span);
            }
            span.innerText = text;
        }
        if(this.config.textTitle){
            cell.setAttribute('title',text);
        }
    }
    return cell;

};
Cells.prototype._createCell = function (row,col,field,cacheCells) {

    var cacheCells = cacheCells || this.domCache.cells;
    var cell = document.createElement('div');
    cell._cell = true;
    this._configCell(cell,field);

    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
    var classNames = [this.getFullClassName('cell')];
    cell.className = classNames.join(' ');

    cacheCells.push(cell);

    this._reLayoutCell(cell);
    return cell;

};
Cells.prototype._reLayoutCell = function (cell) {

    var row = parseInt(cell.getAttribute('row')),
        col = parseInt(cell.getAttribute('col'));
    var colsLeft = this.domCache.colsLeft,
        colsWidth = this.domCache.colsWidth,
        rowsHeight = this.domCache.rowsHeight;
    cell.style.top = this.computeRowTop(row) + 'px';
    cell.style.left = colsLeft[col] + 'px';
    cell.style.width = colsWidth[col] + 'px';
    cell.style.height = rowsHeight[row] + 'px';

    //last column flag
    var colLast = String(this.cellsModel.header.fields.length - 1 === col),
        rowLast = String(this.cellsModel.rows.length - 1 === row);
    cell.setAttribute('col-last',colLast);
    cell.setAttribute('row-last',rowLast);

};
Cells.prototype._onAppendRows = function () {

    var rowsHeight = this.domCache.rowsHeight;
    this._initCellHeightIndex(rowsHeight.length);
    this.syncCursor();
    this.executeFunctionDelay('repaintRequest',this.repaint);

};
Cells.prototype.syncCursor = function () {

    var cursor = this.cursor;
    if(!cursor){
        return;
    }
    var rowsTop = this.domCache.rowsTop,
        rowsHeight = this.domCache.rowsHeight,
        colsLeft = this.domCache.colsLeft,
        colsWidth = this.domCache.colsWidth;
    var curTop = rowsTop[rowsTop.length - 1] + rowsHeight[rowsHeight.length - 1],
        curWidth = colsLeft[colsLeft.length - 1] + colsWidth[colsWidth.length - 1];
    cursor.style.top = curTop + 'px';
    cursor.style.width = curWidth + 'px';

    this.executeFunctionDelay('resizeScrollbar',this.resizeScrollbar);

};
Cells.prototype.resizeScrollbar = function () {

    if(this.scrollbar){
        this.scrollbar.resize();
        return;
    }

};
Cells.prototype._initCellSizeIndex = function () {

    this._initCellWidthIndex();
    this._initCellHeightIndex();

};
Cells.prototype._initCellWidthIndex = function () {

    var colsWidth = this.domCache.colsWidth,
        colsLeft = this.domCache.colsLeft;

    var maxWidth = 0;
    cellsModel.header.fields.forEach(function (field,index) {
        var colWidth = this._parseCellWidth(field.width);
        colsWidth[index] = colWidth;
        maxWidth += colWidth;
        if(index === 0){
            colsLeft[index] = 0;
        }else{
            colsLeft[index] = colsLeft[index - 1] + colsWidth[index - 1];
        }

    }.bind(this));

};
Cells.prototype._initCellHeightIndex = function (startIndex) {

    startIndex = startIndex || 0;

    var cellsModel = this.cellsModel;
    var rows = cellsModel.rows;
    var rowsTop = this.domCache.rowsTop,
        rowsHeight = this.domCache.rowsHeight;

    //create page cursor
    rows.slice(startIndex).forEach(function (row,index) {
        index += startIndex;
        var rowHeight = this._parseCellHeight(row.height);
        rowsHeight[index] = rowHeight;
        if(index === 0){
            rowsTop[index] = 0;
        }else{
            rowsTop[index] = rowsTop[index - 1] + rowsHeight[index - 1];
        }
    }.bind(this));

};
Cells.prototype._createCursor = function () {

    var cursor = document.createElement('i');
    cursor.className = this.getFullClassName('row-cursor');

    this.cursor = cursor;
    this.rowPanel.appendChild(cursor);

    return cursor;

};
Cells.prototype._createBodyContainer = function () {

    var bodyContainer = this.bodyPanel = document.createElement('div');
    bodyContainer.className = this.getFullClassName('body-container');

    bodyContainer.setAttribute('overflowX',String(this.config.overflowX));
    bodyContainer.setAttribute('overflowY',String(this.config.overflowY));

    bodyContainer.appendChild(this._createRowContainer());
    return bodyContainer;
};
Cells.prototype._createRowContainer = function () {

    var rowContainer = document.createElement('div');
    rowContainer.className = this.getFullClassName('row-container');
    this.rowPanel = rowContainer;
    return rowContainer;

};
Cells.prototype._parseCellWidth = function (width) {

    var panelSize = this.getPanelSize();
    var clientWidth = panelSize.width;
    if(typeof width === 'string' && width && width.indexOf('%') === width.length - 1){
        width = Math.floor(parseFloat(width)/100 * clientWidth);
    }else{
        width = parseInt(width);
    }
    return isNaN(width)?100:width;

};
Cells.prototype._parseCellHeight = function (height) {

    if(typeof height === 'string' && height && height.indexOf('%') === height.length - 1){
        var clientHeight = this.getPanelSize().height;
        height = Math.floor(parseFloat(height)/100 * clientHeight);
    }else{
        height = parseInt(height);
    }
    return height?height:30;

};
Cells.prototype.headerHeight = function (height) {

    var cellsModel = this.cellsModel;
    if(!height){
        return cellsModel.header.height;
    }
    height = parseInt(height);
    if(typeof height === 'number'){
        height = height + 'px';
    }
    cellsModel.header.height = height;
    this.headerPanel.style.height = height;
};
Cells.prototype._createHeader = function () {

    var cellsModel = this.cellsModel;
    var headerContainer = document.createElement('header');
    headerContainer.className = this.getFullClassName('header');
    this.headerPanel = headerContainer;
    this.headerHeight(cellsModel.header.height);

    var headerContentPanel = document.createElement('div');
    headerContentPanel.className = this.getFullClassName(headerContentClassName);

    headerContainer.appendChild(headerContentPanel);
    return headerContainer;

};
Cells.prototype._bindCellsModelEvent = function () {
    this.cellsModel.bind('refresh', function () {
        if(this.renderTo){
            this.executeFunctionDelay('refresh',this.refresh);
        }
    }.bind(this));

    this.cellsModel.bind('appendRows', function () {
        if(this.renderTo){
            this.executeFunctionDelay('appendRows',this._onAppendRows);
        }
    }.bind(this));
};
Cells.prototype.executeFunctionDelay = function (timeoutId,func,context) {

    return executeFunctionDelay(timeoutId,func,context || this);

};
Cells.prototype._bindEvent = function () {

    var headerPanel = this.headerPanel,
        scrollbar = this.scrollbar || this.bodyPanel;
    var headerContentPanel = headerPanel.querySelector(this.getFullClassSelector('header-content'));
    scrollbar.addEventListener('scroll', function () {

        var scrollLeft = scrollbar.scrollLeft;
        headerContentPanel.style.left = -scrollLeft + 'px';

        this.executeFunctionDelay('repaintRequest',this.repaint);

    }.bind(this));

    this._bindResizeCellEvent();

    this._bindClickEvent();

};
Cells.prototype.resizeRowHeight = function (rowIndex,height) {
    this.resizeCell(rowIndex,null,null,height);
};
Cells.prototype.resizeColWidth = function (colIndex,width) {
    this.resizeCell(null,colIndex,width,null);
};
Cells.prototype._updateDomCache = function (rowIndex,colIndex,width,height) {

    if(typeof (height = parseInt(height)) === 'number'){
        height = Math.max(0,height);
        var rowsHeight = this.domCache.rowsHeight,
            rowsTop = this.domCache.rowsTop;
        rowsHeight[rowIndex] = height;
        for(var i = rowIndex + 1;i < rowsTop.length;i++){
            rowsTop[i] = rowsTop[i - 1] + rowsHeight[i - 1];
        }
    }
    if(typeof (width = parseInt(width)) === 'number'){
        width = Math.max(0,width);
        var colsWidth = this.domCache.colsWidth,
            colsLeft = this.domCache.colsLeft;
        colsWidth[colIndex] = width;
        for(var i = colIndex + 1;i < colsLeft.length;i++){
            colsLeft[i] = colsLeft[i - 1] + colsWidth[i - 1];
        }
    }
};
Cells.prototype._resizeCellDom = function (rowIndex,colIndex) {

    var rowsHeight = this.domCache.rowsHeight,
        rowsTop = this.domCache.rowsTop;
    var colsWidth = this.domCache.colsWidth,
        colsLeft = this.domCache.colsLeft;
    var cells = this.rowPanel.querySelectorAll(this.getFullClassSelector('cell')),
        size = cells.length,
        cell,row,col;
    for(var i = 0;i < size;i++){
        cell = cells[i];
        row = parseInt(cell.getAttribute('row')),col = parseInt(cell.getAttribute('col'));
        if(row === rowIndex){
            cell.style.height = rowsHeight[row] + 'px';
        }else if(row > rowIndex){
            cell.style.top = rowsTop[row] + 'px';
        }
        if(col === colIndex){
            cell.style.width = colsWidth[col] + 'px';
        }else if(col > colIndex){
            cell.style.left = colsLeft[col] + 'px';
        }
    }

    //update header col width
    cells = this.headerPanel.querySelectorAll(this.getFullClassSelector('cell')),size = cells.length;
    for(var i = 0;i < size;i++){
        cell = cells[i];
        if(rowIndex === -1){
            this.headerHeight(height);
        }
        col = parseInt(cell.getAttribute('col'));
        if(col === colIndex){
            cell.style.width = colsWidth[col] + 'px';
        }else if(col > colIndex){
            cell.style.left = colsLeft[col] + 'px';
        }
    }

};
Cells.prototype.resizeCell = function (rowIndex,colIndex,width,height) {
    this._updateDomCache(rowIndex,colIndex,width,height);
    this._resizeCellDom(rowIndex,colIndex,width,height);
};
Cells.prototype._bindResizeCellEvent = function () {
    if(!this.config.colResize && !this.config.rowResize){
        return;
    }
    var mouseHit = 3,cursors = ['auto','n-resize','w-resize','nw-resize'];
    var bodyPanel = this.bodyPanel,
        rowsTop = this.domCache.rowsTop,
        colsLeft = this.domCache.colsLeft,
        colResize = this.config.colResize,
        rowResize = this.config.rowResize,
        rowsHeight = this.domCache.rowsHeight,
        colsWidth = this.domCache.colsWidth;

    var _ = this;
    function getMouseInfo(e){
        var position = getMousePosition(e);
        var scrollTo = _.scrollTo();
        var bound = bodyPanel.getBoundingClientRect(),relY = position.pageY - bound.top,
            relX = position.pageX - bound.left;

        var rowHit = 0,rowIndex = undefined;
        rowResize && rowsTop.some(function (rowTop,index) {
            var h = rowsHeight[index];
            if(Math.abs(rowTop + h - scrollTo.scrollTop - relY) < mouseHit){
                rowHit = 1;
                rowIndex = index;
                return true;
            }
        });

        var colHit = 0,colIndex = undefined;
        colResize && colsLeft.some(function (colLeft,index) {
            var w = colsWidth[index];
            if(Math.abs(colLeft + w - scrollTo.scrollLeft - relX) < mouseHit){
                colHit = 2;
                colIndex = index;
                return true;
            }
        });
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
    bodyPanel.addEventListener('mousemove', function (e) {
        this.executeFunctionDelay('rowPanel-mousemove',function () {
            var mouseInfo = getMouseInfo(e);
            bodyPanel.style.cursor = mouseInfo.cursor;
        });

    }.bind(this));

    bodyPanel.addEventListener('mousemove', function (e) {
        var mouseInfo = getMouseInfo(e);
        //resizeCell
        var rowIndex = resizeManager.rowIndex,
            colIndex = resizeManager.colIndex,
            width,height,
            resizeFlag = false;
        if(resizeManager.lastPageY  !== undefined){
            height = mouseInfo.position.pageY - resizeManager.lastPageY + rowsHeight[rowIndex];
            resizeManager.lastPageY = mouseInfo.position.pageY;
            resizeFlag = true;
        }

        if(resizeManager.lastPageX !== undefined){
            width = mouseInfo.position.pageX - resizeManager.lastPageX + colsWidth[colIndex];
            resizeManager.lastPageX = mouseInfo.position.pageX;
            resizeFlag = true;
        }
        if(resizeFlag){
            this.resizeCell(rowIndex,colIndex,width,height);
        }
    }.bind(this));


    bodyPanel.addEventListener('mousedown', function (e) {

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
            e.stopPropagation();
            e.preventDefault();
            resizeManager.resetX();
        }

        this.cellPanel.setAttribute('resize',String(resizeFlag));

    }.bind(this));
    function mouseup(){
        this.cellPanel.setAttribute('resize',String(false));
        if(resizeManager.reset()){
            this.syncCursor();
        }
    }
    bodyPanel.addEventListener('mouseup',mouseup.bind(this));
    bodyPanel.addEventListener('mouseleave',mouseup.bind(this));

};
Cells.prototype.createEvent = function (eventType,target,data) {

   return {
       type:eventType,
       target:target,
       data:data
   };

};
Cells.prototype.tiggerCellEvent = function (cell) {

    var cellsModel = this.cellsModel,col = parseInt(cell.getAttribute('col'));
    if(cell._headerCell){
        this.triggerEvent(this.createEvent('cellClick',cell,cellsModel.header.fields[col]));
        return;
    }
    var row = parseInt(cell.getAttribute('row'));
    var rowData = cellsModel.rows[row];
    if(rowData){
        this.triggerEvent(this.createEvent('cellClick',cell,rowData.fields[col]));
    }
};
Cells.prototype._bindClickEvent = function () {

    var _ = this,cellPanel = this.cellPanel;
    cellPanel.addEventListener('click', function (e) {

        var target = e.target;
        if(target === cellPanel){
            _.tiggerCellEvent(_.createEvent('click',target,_.cellsModel));
            return;
        }
        if(_.eventManager.cellClick && _.eventManager.cellClick.length >= 0){
            if(target._cell){
                _.tiggerCellEvent(target);
            }else{
                while(target = target.parentNode){
                    if(target === cellPanel){
                        break;
                    }
                    if(target._cell){
                        _.tiggerCellEvent(target);
                        break;
                    }
                }
            }
        }
        _.triggerEvent(_.createEvent('click',target,_.cellsModel));
    });

};

exports.CellsModel = CellsModel;
exports.Cells = Cells;

Object.defineProperty(exports, '__esModule', { value: true });

})));
