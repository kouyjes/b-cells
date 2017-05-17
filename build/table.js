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

/**
 * Created by koujp on 2016/10/17.
 */
var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(executor){
            return setTimeout(executor,1000/60);
        };
var cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.clearTimeout;


function TableCell(tableModel,config){

    if(!(tableModel instanceof TableModel)){
        throw new TypeError('arguments must be instanceof TableModel !');
    }
    this.tableModel = tableModel;

    this.config = Object.assign({
        textTitle:false,
        colResize:false,
        rowResize:false,
        overflowX:'',
        overflowY:''
    },config);

    this._timeoutCache = {};

    this._bindTableModelEvent();

}
TableCell.prototype.themesPrefix = 'd1012';
TableCell.prototype.init = function () {

    this.tablePanel = null;
    this.headerPanel = null;
    this.rowPanel = null;
    this.cursor = null;

    this.rowClientArea = null;
    this.colClientArea = null;

    this.domCache = {
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

    this._cachePanelSize();

    var tablePanel = this.tablePanel = document.createElement('div');
    tablePanel.className = this.getFullClassName();
    var dirtyPanel = renderTo.querySelector(this.getFullClassSelector());
    dirtyPanel && renderTo.removeChild(dirtyPanel);

    this._initRowHeightIndex();

    tablePanel.appendChild(this._createHeader());

    tablePanel.appendChild(this._createRowContainer());
    renderTo.appendChild(tablePanel);

    this._bindEvent();

    this.dispatchScrollEvent();

};
TableCell.prototype._setRenderTo = function (renderTo) {

    if(typeof renderTo === 'string'){
        renderTo = document.querySelector(renderTo);
    }

    if(!this.checkDomElement(renderTo)){
        throw new TypeError('renderTo must be a dom element !');
    }

    this.renderTo = renderTo;

};
TableCell.prototype.checkDomElement = function (object) {

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

};
TableCell.prototype.dispatchScrollEvent = function () {

    var rowPanel = this.rowPanel;
    var scrollEvent = document.createEvent('Event');
    scrollEvent.initEvent('scroll',true,true);
    rowPanel.dispatchEvent(scrollEvent);

};
TableCell.prototype.scrollTo = function (scrollTop,scrollLeft) {

    var rowPanel = this.rowPanel;

    if(arguments.length === 0){
        return {
            scrollLeft:rowPanel.scrollLeft,
            scrollTop:rowPanel.scrollTop
        };
    }
    rowPanel.scrollLeft = scrollLeft;
    rowPanel.scrollTop = scrollTop;

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

    var panelSize = this.getPanelSize();
    var colsLeft = this.domCache.colsLeft;
    var left = this.rowPanel.scrollLeft;
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

    var panelSize = this.getPanelSize();
    var rowsTop = this.domCache.rowsTop;
    var top = this.rowPanel.scrollTop;
    return this.getThresholdArea(panelSize.height,rowsTop,top);

};
TableCell.prototype.getRowRepaintAreas = function () {

    return this._getRepaintAreas('row');

};
TableCell.prototype.getColRepaintAreas = function () {

    return this._getRepaintAreas('col');

};
TableCell.prototype._getRepaintAreas_ = function (type) {

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
TableCell.prototype._getRepaintAreas = function (type) {

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
TableCell.prototype.repaint = function () {

    var rowRepaintAreas = this.getRowRepaintAreas(),
        colRepaintAreas = this.getColRepaintAreas();

    var rowClientArea = rowRepaintAreas.currentArea,
        colClientArea = colRepaintAreas.currentArea;
    this.rowClientArea = rowClientArea;
    this.colClientArea = colClientArea;

    if(rowRepaintAreas.length === 0 && colRepaintAreas.length === 0){
        return;
    }

    if(rowRepaintAreas.length === 0){
        rowRepaintAreas.push(rowClientArea);
    }
    if(colRepaintAreas.length === 0){
        colRepaintAreas.push(colClientArea);
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

    rowRepaintAreas.forEach(function (area) {
        var row;
        for(var rowIndex = area.from;rowIndex < area.from + area.pageSize;rowIndex++){

            row = rows[rowIndex];
            colRepaintAreas.forEach(function (colArea) {
                var cell,field;
                for(var colIndex = colArea.from;colIndex < colArea.from + colArea.pageSize;colIndex++){
                    field = row.fields[colIndex];
                    cell = cells.pop();
                    if(!cell){
                        cell = this._createCell(rowIndex,colIndex,field);
                        this.rowPanel.appendChild(cell);
                    }else{
                        this._repaintCell(cell,rowIndex,colIndex,field);
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
TableCell.prototype._repaintCell = function (cell,row,col,field) {

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
TableCell.prototype._createCell = function (row,col,field,cacheDisabled) {

    var cacheCells = this.domCache.cells;
    var cell = document.createElement('div');
    this._configCell(cell,field);

    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
    var classNames = [this.getFullClassName('cell')];
    cell.className = classNames.join(' ');

    !cacheDisabled && cacheCells.push(cell);

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
TableCell.prototype.updateCursorHeight = function () {

    var tableModel = this.tableModel;
    var rowsTop = this.domCache.rowsTop,
        rowsHeight = this.domCache.rowsHeight;

    var rows = tableModel.rows;
    for(var rowIndex = rowsHeight.length;rowIndex < rows.length;rowIndex++){
        var rowHeight = this._parseRowHeight(rows[rowIndex].height);
        rowsHeight[rowIndex] = rowHeight;
        rowsTop[rowIndex] = rowsTop[rowIndex - 1] + rowsHeight[rowIndex - 1];
    }

    this.syncCursor();

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

};
TableCell.prototype._initRowHeightIndex = function () {

    var tableModel = this.tableModel;
    var rows = tableModel.rows;
    var rowsTop = this.domCache.rowsTop,
        rowsHeight = this.domCache.rowsHeight;

    //create page cursor
    rows.forEach(function (row,index) {
        var rowHeight = this._parseRowHeight(row.height);
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

    this.syncCursor();

    return cursor;

};
TableCell.prototype._createRowContainer = function () {

    var rowContainer = document.createElement('div');
    rowContainer.className = this.getFullClassName('row-container');
    this.rowPanel = rowContainer;
    var cursor = this._createCursor();
    rowContainer.appendChild(cursor);

    if(this.config.overflowX){
        rowContainer.style.overflowX = this.config.overflowX;
    }
    if(this.config.overflowY){
        rowContainer.style.overflowY = this.config.overflowY;
    }

    return rowContainer;

};
TableCell.prototype._parseColWidth = function (width) {

    var panelSize = this.getPanelSize();
    var clientWidth = panelSize.width;
    if(typeof width === 'string' && width && width.indexOf('%') === width.length - 1){
        width = Math.floor(parseFloat(width)/100 * clientWidth);
    }else{
        width = parseInt(width);
    }
    return isNaN(width)?100:width;

};
TableCell.prototype._parseRowHeight = function (height) {

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
    headerContentPanel.className = this.getFullClassName('header-content');
    var colsWidth = this.domCache.colsWidth,
        colsLeft = this.domCache.colsLeft;

    var maxWidth = 0;
    tableModel.header.fields.forEach(function (field,index) {
        var colWidth = this._parseColWidth(field.width);
        colsWidth[index] = colWidth;
        maxWidth += colWidth;
        if(index === 0){
            colsLeft[index] = 0;
        }else{
            colsLeft[index] = colsLeft[index - 1] + colsWidth[index - 1];
        }
        var headerCell = this._createCell(0,index,field,true);
        headerContentPanel.appendChild(headerCell);

    }.bind(this));

    var panelSize = this.getPanelSize();
    if(maxWidth <= panelSize.width){
        this.config.overflowX = 'hidden';
    }

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
            this.executeFunctionDelay('updateCursorHeight',this.updateCursorHeight);
        }
    }.bind(this));
};
TableCell.prototype.executeFunctionDelay = function (timeoutId,func,context) {

    if(typeof func !== 'function'){
        return;
    }
    context = context || this;
    cancelAnimationFrame(this._timeoutCache[timeoutId]);
    return this._timeoutCache[timeoutId] = requestAnimationFrame(func.bind(context));

};
TableCell.prototype._bindEvent = function () {

    var headerPanel = this.headerPanel,
        rowPanel = this.rowPanel;
    var headerContentPanel = headerPanel.querySelector(this.getFullClassSelector('header-content'));
    rowPanel.addEventListener('scroll', function () {

        var scrollLeft = rowPanel.scrollLeft;
        headerContentPanel.style.transform = 'translate3d(' + -scrollLeft + 'px' + ',0,0)';
        this.executeFunctionDelay('paintRequest',this.repaint);

    }.bind(this));

    this._bindResizeCellEvent();

};
function getMousePosition(e){
    var pageX = e.pageX || e.clientX,
        pageY = e.pageY || e.clientY;
    return {
        pageX:pageX,
        pageY:pageY
    };
}
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
    var rowPanel = this.rowPanel,
        rowsTop = this.domCache.rowsTop,
        colsLeft = this.domCache.colsLeft,
        colResize = this.config.colResize,
        rowResize = this.config.rowResize,
        rowsHeight = this.domCache.rowsHeight,
        colsWidth = this.domCache.colsWidth;

    var self = this;
    function getMouseInfo(e){
        var position = getMousePosition(e);
        var scrollTo = self.scrollTo();
        var bound = rowPanel.getBoundingClientRect(),relY = position.pageY - bound.top,
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
    rowPanel.addEventListener('mousemove', function (e) {
        this.executeFunctionDelay('rowPanel-mousemove',function () {
            var mouseInfo = getMouseInfo(e);
            rowPanel.style.cursor = mouseInfo.cursor;
        });

    }.bind(this));

    rowPanel.addEventListener('mousemove', function (e) {
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


    rowPanel.addEventListener('mousedown', function (e) {

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
    rowPanel.addEventListener('mouseup',mouseup.bind(this));
    rowPanel.addEventListener('mouseleave',mouseup.bind(this));
};

exports.TableModel = TableModel;
exports.TableCell = TableCell;

Object.defineProperty(exports, '__esModule', { value: true });

})));
