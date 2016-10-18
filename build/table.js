(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.CELL = global.CELL || {})));
}(this, (function (exports) { 'use strict';

/**
 * Created by koujp on 2016/10/17.
 */
function TableModel(tableModel){
    this.header = [];//{name:''}
    this.rows = [];//[{fields:[]}]

    this._eventListener = {
        onCellLoad:[],
        onCellUnload:[],
        onRefresh:[]
    };

    if(arguments.length > 0){
        this.init(tableModel);
    }
}
TableModel.prototype.init = function (tableModel) {
    if(tableModel.header instanceof Array){
        this.header = tableModel.header;
    }
    if(tableModel.rows instanceof Array){
        this.rows = tableModel.rows;
    }
    var eventListener = tableModel._eventListener;
    if(!eventListener){
        return;
    }
    var context = this;
    ['cellLoad','cellUnload','refresh'].forEach(function (eventName) {
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

/**
 * Created by koujp on 2016/10/17.
 */
var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(executor){
            return setTimeout(executor,1000/60);
        };
var cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.clearTimeout;

function TableCell(tableModel){
    if(!(tableModel instanceof TableModel)){
        throw new TypeError('arguments must be instanceof TableModel !');
    }
    this.tableModel = tableModel;

    this.config = {};
}
TableCell.prototype.themesPrefix = 'd1012';
TableCell.prototype.render = function (renderTo) {

    if(typeof renderTo === 'string'){
        renderTo = document.querySelector(renderTo);
    }
    this.renderTo = renderTo;

    this.refresh();

    this.tableModel.bind('refresh', function () {
        this.refresh();
    }.bind(this));
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
TableCell.prototype.init = function () {
    this.headerPanel = null;
    this.rowPanel = null;

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
TableCell.prototype.refresh = function () {

    this.init();
    var renderTo = this.renderTo;
    if(!renderTo || renderTo.nodeType !== 1){
        return;
    }

    this.cachePanelSize();

    var tablePanel = document.createElement('div');
    tablePanel.className = this.getFullClassName();
    var dirtyPanel = renderTo.querySelector(this.getFullClassSelector());
    dirtyPanel && renderTo.removeChild(dirtyPanel);

    tablePanel.appendChild(this.createHeader());
    tablePanel.appendChild(this.createRowContainer());
    this.bindEvent();
    renderTo.appendChild(tablePanel);

    requestAnimationFrame(function () {
        this.dispatchScrollEvent();
    }.bind(this));

};
TableCell.prototype.dispatchScrollEvent = function () {
    var rowPanel = this.rowPanel;
    var scrollEvent = document.createEvent('Event');
    scrollEvent.initEvent('scroll',true,true);
    rowPanel.dispatchEvent(scrollEvent);
};
TableCell.prototype.scrollTo = function (scrollLeft,scrollTop) {

    var rowPanel = this.rowPanel;

    rowPanel.scrollLeft = scrollLeft;
    rowPanel.scrollTop = scrollTop;
};
TableCell.prototype.cachePanelSize = function () {
    var renderTo = this.renderTo;
    renderTo.currentWidth = renderTo.clientWidth;
    renderTo.currentHeight = renderTo.clientHeight;
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
    return this.getRepaintAreas('row');
};
TableCell.prototype.getColRepaintAreas = function () {
    return this.getRepaintAreas('col');
};
TableCell.prototype.getRepaintAreas = function (type) {
    var lastArea = type === 'row'?this.rowClientArea:this.colClientArea,
        curArea = type === 'row'?this.getCurrentRowArea():this.getCurrentColArea();

    var areas = [];
    areas.currentArea = curArea;
    
    if(lastArea == null){
        lastArea = curArea;
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
                        cell = this.createCell(rowIndex,colIndex,field);
                        this.rowPanel.appendChild(cell);
                    }else{
                        this.repaintCell(cell,rowIndex,colIndex,field);
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
TableCell.prototype.repaintCell = function (cell,row,col,field) {

    this.configCell(cell,field);

    var colsLeft = this.domCache.colsLeft,
        colsWidth = this.domCache.colsWidth,
        rowsHeight = this.domCache.rowsHeight;
    cell.style.top = this.computeRowTop(row) + 'px';
    cell.style.left = colsLeft[col] + 'px';
    cell.style.width = colsWidth[col] + 'px';
    cell.style.height = rowsHeight[row] + 'px';
    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
};
TableCell.prototype.configCell = function (cell,field) {
    cell.innerHTML = '';
    var textNode = document.createElement('span');
    textNode.appendChild(document.createTextNode(field.name || field.value));
    cell.setAttribute('title',textNode.innerText);
    cell.appendChild(textNode);
    return cell;
};
TableCell.prototype.createCell = function (row,col,field,cacheDisabled) {

    var cacheCells = this.domCache.cells;
    var cell = document.createElement('div');
    this.configCell(cell,field);
    var colsLeft = this.domCache.colsLeft,
        colsWidth = this.domCache.colsWidth,
        rowsHeight = this.domCache.rowsHeight;

    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
    var classNames = [this.getFullClassName('cell')];
    cell.style.top = this.computeRowTop(row) + 'px';
    cell.style.left = colsLeft[col] + 'px';
    cell.style.width = colsWidth[col] + 'px';
    cell.style.height = rowsHeight[row] + 'px';
    cell.className = classNames.join(' ');

    !cacheDisabled && cacheCells.push(cell);

    return cell;
};
TableCell.prototype.createCursor = function () {
    var tableModel = this.tableModel;
    var rows = tableModel.rows;
    var colsLeft = this.domCache.colsLeft,
        colsWidth = this.domCache.colsWidth,
        rowsTop = this.domCache.rowsTop,
        rowsHeight = this.domCache.rowsHeight;
    //create page cursor
    var maxHeight = 0;
    rows.forEach(function (row,index) {
        var rowHeight = this.parseRowHeight(row.height);
        rowsHeight[index] = rowHeight;
        maxHeight += rowHeight;
        if(index === 0){
            rowsTop[index] = 0;
        }else{
            rowsTop[index] = rowsTop[index - 1] + rowsHeight[index - 1];
        }
    }.bind(this));

    var cursor = document.createElement('i');
    cursor.className = this.getFullClassName('row-cursor');

    cursor.style.top = rowsTop[rowsTop.length - 1] + rowsHeight[rowsHeight.length - 1] + 'px';
    cursor.style.width = colsLeft[colsLeft.length - 1] + colsWidth[colsWidth.length - 1] + 'px';

    var panelSize = this.getPanelSize();
    if(rowsHeight <= panelSize.height){
        this.config.overflowY = 'hidden';
    }
    return cursor;
};
TableCell.prototype.createRowContainer = function () {
    var rowContainer = document.createElement('div');
    rowContainer.className = this.getFullClassName('row-container');
    this.rowPanel = rowContainer;

    var cursor = this.createCursor();
    rowContainer.appendChild(cursor);

    if(this.config.overflowX){
        rowContainer.style.overflowX = this.config.overflowX;
    }
    if(this.config.overflowY){
        rowContainer.style.overflowY = this.config.overflowY;
    }

    return rowContainer;
};
TableCell.prototype.parseColWidth = function (width) {
    var panelSize = this.getPanelSize();
    var clientWidth = panelSize.width;
    if(typeof width === 'string' && width && width.indexOf('%') === width.length - 1){
        width = Math.floor(parseFloat(width)/100 * clientWidth);
    }else{
        width = parseInt(width);
    }
    return isNaN(width)?100:width;
};
TableCell.prototype.parseRowHeight = function (height) {

    if(typeof height === 'string' && height && height.indexOf('%') === height.length - 1){
        var panelSize = this.getPanelSize();
        var clientHeight = panelSize.height;
        height = Math.floor(parseFloat(height)/100 * clientHeight);
    }else{
        height = parseInt(height);
    }
    return height?height:30;
};
TableCell.prototype.createHeader = function () {
    var tableModel = this.tableModel;
    var headerContainer = document.createElement('header');
    headerContainer.className = this.getFullClassName('header');
    this.headerPanel = headerContainer;

    var headerContentPanel = document.createElement('div');
    headerContentPanel.className = this.getFullClassName('header-content');
    var colsWidth = this.domCache.colsWidth,
        colsLeft = this.domCache.colsLeft;

    var maxWidth = 0;
    tableModel.header.forEach(function (field,index) {
        var colWidth = this.parseColWidth(field.width);
        colsWidth[index] = colWidth;
        maxWidth += colWidth;
        if(index === 0){
            colsLeft[index] = 0;
        }else{
            colsLeft[index] = colsLeft[index - 1] + colsWidth[index - 1];
        }
        var headerCell = this.createCell(0,index,field,true);
        headerContentPanel.appendChild(headerCell);

    }.bind(this));

    var panelSize = this.getPanelSize();
    if(colsWidth <= panelSize.width){
        this.config.overflowX = 'hidden';
    }

    headerContainer.appendChild(headerContentPanel);
    return headerContainer;
};
TableCell.prototype.bindEvent = function () {
    var headerPanel = this.headerPanel,
        rowPanel = this.rowPanel;
    var headerContentPanel = headerPanel.querySelector(this.getFullClassSelector('header-content'));
    var timeout;
    rowPanel.addEventListener('scroll', function () {
        var scrollLeft = rowPanel.scrollLeft,
            scrollTop = rowPanel.scrollTop;

        this.config.scrollLeft = scrollLeft;
        this.config.scrollTop = scrollTop;

        headerContentPanel.style.transform = 'translate3d(' + -scrollLeft + 'px' + ',0,0)';
        cancelAnimationFrame(timeout);
        timeout = requestAnimationFrame(function () {
            this.repaint();
        }.bind(this));

    }.bind(this));
};

exports.TableModel = TableModel;
exports.TableCell = TableCell;

Object.defineProperty(exports, '__esModule', { value: true });

})));
