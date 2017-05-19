(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.CELL = global.CELL || {})));
}(this, (function (exports) { 'use strict';

/**
 * Created by koujp on 2016/10/17.
 */
function TableModel(tableModel){
    this.header = {
        fields:[]
    };//{name:''}
    this.rows = [];//[{fields:[]}]

    this._eventListener = {
        onAppendRows:[],
        onRefresh:[]
    };

    if(arguments.length > 0){
        this.init(tableModel);
    }
}
TableModel.prototype.init = function (tableModel) {
    if(tableModel.header && tableModel.header.fields instanceof Array){
        this.header.fields = tableModel.header.fields;
    }
    if(tableModel.rows instanceof Array){
        this.rows = tableModel.rows;
    }
    var eventListener = tableModel._eventListener;
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
TableModel.prototype.bind = function (eventName,listener) {
    if(typeof eventName !== 'string' || typeof listener !== 'function'){
        return;
    }
    eventName = this.getEventKey(eventName);
    if(eventName && this._eventListener[eventName].indexOf(listener) === -1){
        this._eventListener[eventName].push(listener);
    }
};
TableModel.prototype.getEventKey = function (eventName) {
    if(eventName.length > 1){
        eventName = 'on' + eventName[0].toUpperCase()  + eventName.substring(1);
        if(this._eventListener[eventName] instanceof Array){
            return eventName;
        }
    }
    return null;
};
TableModel.prototype.trigger = function (eventName) {
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
TableModel.prototype.refresh = function () {
    this.trigger('refresh');
};
TableModel.prototype.appendRows = function (rows) {
    this.rows = this.rows.concat(rows);
    this.trigger('appendRows');
};

function getMousePosition(e){
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
        scrollHeight += this.config.height;
    }
    if(this.config.overflowX && scrollHeight > height){
        scrollWidth += this.config.width;
    }
    this.scrollWidth = scrollWidth;
    this.scrollHeight = scrollHeight;
};
ScrollBar.prototype._createScrollBarBlock = function () {

    var bar = document.createElement('div');
    bar.className = 'scrollbar-block';
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

};

/**
 * Created by koujp on 2016/10/17.
 */
var headerContentClassName = 'header-content';
function TableCell(tableModel,config){

    if(!(tableModel instanceof TableModel)){
        throw new TypeError('arguments must be instanceof TableModel !');
    }
    this.tableModel = tableModel;

    this.config = Object.assign({
        enableCustomScroll:false,
        textTitle:false,
        colResize:false,
        rowResize:false,
        overflowX:false,
        overflowY:false
    },config);

    this._bindTableModelEvent();

}
TableCell.prototype.themesPrefix = 'd1012';
TableCell.prototype.init = function () {

    this.tablePanel = null;
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

};
TableCell.prototype.getFullClassName = function (className) {

    if(!className){
        return this.themesPrefix;
    }
    return this.themesPrefix + '-' + className;

};
TableCell.prototype.getFullClassSelector = function (selector) {

    return '.' + this.getFullClassName(selector);

};
TableCell.prototype.render = function (renderTo) {

    this._setRenderTo(renderTo);
    this.refresh();

};
TableCell.prototype.refresh = function () {

    this.init();
    var renderTo = this.renderTo;
    if(!renderTo || renderTo.nodeType !== 1){
        throw new TypeError('parent container is invalid !');
    }

    var tablePanel = this.tablePanel = document.createElement('div');
    tablePanel.className = this.getFullClassName();
    var dirtyPanel = renderTo.querySelector(this.getFullClassSelector());
    dirtyPanel && renderTo.removeChild(dirtyPanel);

    tablePanel.appendChild(this._createHeader());

    tablePanel.appendChild(this._createBodyContainer());
    renderTo.appendChild(tablePanel);

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
TableCell.prototype._setRenderTo = function (renderTo) {

    if(typeof renderTo === 'string'){
        renderTo = document.querySelector(renderTo);
    }

    if(!isDomElement(renderTo)){
        throw new TypeError('renderTo must be a dom element !');
    }

    this.renderTo = renderTo;

};
TableCell.prototype.scrollTo = function (scrollTop,scrollLeft) {

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
TableCell.prototype._cachePanelSize = function () {

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
TableCell.prototype.getPanelSize = function () {

    return {
        width:this.renderTo.currentWidth,
        height:this.renderTo.currentHeight
    };

};
TableCell.prototype.getCurrentColArea = function () {

    var scrollbar = this.scrollbar || this.bodyPanel;
    var panelSize = this.getPanelSize();
    var colsLeft = this.domCache.colsLeft;
    var left = scrollbar.scrollLeft;
    return this.getThresholdArea(panelSize.width,colsLeft,left);

};
TableCell.prototype.getThresholdArea = function (viewSize,positions,cursor) {

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
TableCell.prototype.getCurrentRowArea = function () {

    var scrollbar = this.scrollbar || this.bodyPanel;
    var panelSize = this.getPanelSize();
    var rowsTop = this.domCache.rowsTop;
    var top = scrollbar.scrollTop;
    return this.getThresholdArea(panelSize.height,rowsTop,top);

};
TableCell.prototype.getRowPaintAreas = function () {

    return this._getPaintAreas('row');

};
TableCell.prototype.getColPaintAreas = function () {

    return this._getPaintAreas('col');

};
TableCell.prototype._getPaintAreas_ = function (type) {

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
TableCell.prototype._getPaintAreas = function (type) {

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
TableCell.prototype.paint = function () {

    this._cachePanelSize();
    this._initCellSizeIndex();
    this.paintHeader();
    this.paintBody();
    this.syncCursor();

};
TableCell.prototype.repaint = function () {

    this.paintHeader();
    this.paintBody();

};
TableCell.prototype.paintHeader = function () {

    var cellsCache = this.domCache.headerCells,
        headerContentPanel = this.headerPanel.querySelector(this.getFullClassSelector(headerContentClassName));
    tableModel.header.fields.forEach(function (field,index) {
        var headerCell = cellsCache[index];
        if(!headerCell){
            headerCell = this._createCell(0,index,field,cellsCache);
            headerContentPanel.appendChild(headerCell);
        }else{
            this._paintCell(headerCell,0,index,field);
        }
    }.bind(this));

};
TableCell.prototype.paintBody = function () {

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

    var rows = this.tableModel.rows;

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
TableCell.prototype.computeRowTop = function (row) {

    var rowsTop = this.domCache.rowsTop;
    return rowsTop[row];

};
TableCell.prototype._paintCell = function (cell,row,col,field) {

    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
    this._configCell(cell,field);
    this._reLayoutCell(cell);

};
TableCell.prototype._configCell = function (cell,field) {

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
TableCell.prototype._createCell = function (row,col,field,cacheCells) {

    var cacheCells = cacheCells || this.domCache.cells;
    var cell = document.createElement('div');
    this._configCell(cell,field);

    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
    var classNames = [this.getFullClassName('cell')];
    cell.className = classNames.join(' ');

    cacheCells.push(cell);

    this._reLayoutCell(cell);
    return cell;

};
TableCell.prototype._reLayoutCell = function (cell) {

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
    var colLast = String(this.tableModel.header.fields.length - 1 === col),
        rowLast = String(this.tableModel.rows.length - 1 === row);
    cell.setAttribute('col-last',colLast);
    cell.setAttribute('row-last',rowLast);

};
TableCell.prototype._onAppendRows = function () {

    var rowsHeight = this.domCache.rowsHeight;
    this._initCellHeightIndex(rowsHeight.length);
    this.executeFunctionDelay('repaintRequest',this.repaint);

};
TableCell.prototype.syncCursor = function () {

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
TableCell.prototype.resizeScrollbar = function () {

    if(this.scrollbar){
        this.scrollbar.resize();
        return;
    }

};
TableCell.prototype._initCellSizeIndex = function () {

    this._initCellWidthIndex();
    this._initCellHeightIndex();

};
TableCell.prototype._initCellWidthIndex = function () {

    var colsWidth = this.domCache.colsWidth,
        colsLeft = this.domCache.colsLeft;

    var maxWidth = 0;
    tableModel.header.fields.forEach(function (field,index) {
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
TableCell.prototype._initCellHeightIndex = function (startIndex) {

    startIndex = startIndex || 0;

    var tableModel = this.tableModel;
    var rows = tableModel.rows;
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
TableCell.prototype._createCursor = function () {

    var cursor = document.createElement('i');
    cursor.className = this.getFullClassName('row-cursor');

    this.cursor = cursor;
    this.rowPanel.appendChild(cursor);

    return cursor;

};
TableCell.prototype._createBodyContainer = function () {

    var bodyContainer = this.bodyPanel = document.createElement('div');
    bodyContainer.className = this.getFullClassName('body-container');

    bodyContainer.setAttribute('overflowX',String(this.config.overflowX));
    bodyContainer.setAttribute('overflowY',String(this.config.overflowY));

    bodyContainer.appendChild(this._createRowContainer());
    return bodyContainer;
};
TableCell.prototype._createRowContainer = function () {

    var rowContainer = document.createElement('div');
    rowContainer.className = this.getFullClassName('row-container');
    this.rowPanel = rowContainer;
    return rowContainer;

};
TableCell.prototype._parseCellWidth = function (width) {

    var panelSize = this.getPanelSize();
    var clientWidth = panelSize.width;
    if(typeof width === 'string' && width && width.indexOf('%') === width.length - 1){
        width = Math.floor(parseFloat(width)/100 * clientWidth);
    }else{
        width = parseInt(width);
    }
    return isNaN(width)?100:width;

};
TableCell.prototype._parseCellHeight = function (height) {

    if(typeof height === 'string' && height && height.indexOf('%') === height.length - 1){
        var clientHeight = this.getPanelSize().height;
        height = Math.floor(parseFloat(height)/100 * clientHeight);
    }else{
        height = parseInt(height);
    }
    return height?height:30;

};
TableCell.prototype.headerHeight = function (height) {

    var tableModel = this.tableModel;
    if(!height){
        return tableModel.header.height;
    }
    height = parseInt(height);
    if(typeof height === 'number'){
        height = height + 'px';
    }
    tableModel.header.height = height;
    this.headerPanel.style.height = height;
};
TableCell.prototype._createHeader = function () {

    var tableModel = this.tableModel;
    var headerContainer = document.createElement('header');
    headerContainer.className = this.getFullClassName('header');
    this.headerPanel = headerContainer;
    this.headerHeight(tableModel.header.height);

    var headerContentPanel = document.createElement('div');
    headerContentPanel.className = this.getFullClassName(headerContentClassName);

    headerContainer.appendChild(headerContentPanel);
    return headerContainer;

};
TableCell.prototype._bindTableModelEvent = function () {
    this.tableModel.bind('refresh', function () {
        if(this.renderTo){
            this.executeFunctionDelay('refresh',this.refresh);
        }
    }.bind(this));

    this.tableModel.bind('appendRows', function () {
        if(this.renderTo){
            this.executeFunctionDelay('appendRows',this._onAppendRows);
        }
    }.bind(this));
};
TableCell.prototype.executeFunctionDelay = function (timeoutId,func,context) {

    return executeFunctionDelay(timeoutId,func,context || this);

};
TableCell.prototype._bindEvent = function () {

    var headerPanel = this.headerPanel,
        scrollbar = this.scrollbar || this.bodyPanel;
    var headerContentPanel = headerPanel.querySelector(this.getFullClassSelector('header-content'));
    scrollbar.addEventListener('scroll', function () {

        var scrollLeft = scrollbar.scrollLeft;
        headerContentPanel.style.left = -scrollLeft + 'px';

        this.executeFunctionDelay('repaintRequest',this.repaint);

    }.bind(this));

    this._bindResizeCellEvent();

};
TableCell.prototype.resizeRowHeight = function (rowIndex,height) {
    this.resizeCell(rowIndex,null,null,height);
};
TableCell.prototype.resizeColWidth = function (colIndex,width) {
    this.resizeCell(null,colIndex,width,null);
};
TableCell.prototype._updateDomCache = function (rowIndex,colIndex,width,height) {

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
TableCell.prototype._resizeCellDom = function (rowIndex,colIndex) {

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
TableCell.prototype.resizeCell = function (rowIndex,colIndex,width,height) {
    this._updateDomCache(rowIndex,colIndex,width,height);
    this._resizeCellDom(rowIndex,colIndex,width,height);
};
TableCell.prototype._bindResizeCellEvent = function () {
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
            this.resetX().resetY();
        },
        resetX: function () {
            this.lastPageX = this.colIndex = undefined;
            return this;
        },
        resetY: function () {
            this.lastPageY = this.rowIndex  = undefined;
            return this;
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
            resizeFlag = true;
            resizeManager.lastPageY = mouseInfo.position.pageY;
        }

        if(resizeManager.lastPageX !== undefined){
            width = mouseInfo.position.pageX - resizeManager.lastPageX + colsWidth[colIndex];
            resizeFlag = true;
            resizeManager.lastPageX = mouseInfo.position.pageX;
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
            resizeManager.resetX();
        }

        this.tablePanel.setAttribute('resize',String(resizeFlag));

    }.bind(this));
    function mouseup(){
        resizeManager.reset();
        this.tablePanel.setAttribute('resize',String(false));
        this.syncCursor();
    }
    bodyPanel.addEventListener('mouseup',mouseup.bind(this));
    bodyPanel.addEventListener('mouseleave',mouseup.bind(this));
};

exports.TableModel = TableModel;
exports.TableCell = TableCell;

Object.defineProperty(exports, '__esModule', { value: true });

})));
