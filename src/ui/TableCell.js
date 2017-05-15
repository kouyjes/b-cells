/**
 * Created by koujp on 2016/10/17.
 */
import { TableModel } from '../model/TableModel';

var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(executor){
            return setTimeout(executor,1000/60);
        },
    cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.clearTimeout;


function TableCell(tableModel){

    if(!(tableModel instanceof TableModel)){
        throw new TypeError('arguments must be instanceof TableModel !');
    }
    this.tableModel = tableModel;

    this.config = {};

    this._timeoutCache = {};

    this._bindTableModelEvent();

}
TableCell.prototype.themesPrefix = 'd1012';
TableCell.prototype.init = function () {

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

    var tablePanel = document.createElement('div');
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
        return object.hasOwnProperty(key);
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
                        cell = this.createCell(rowIndex,colIndex,field);
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

    this._configCell(cell,field);
    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
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
        cell.setAttribute('title',text);
    }
    return cell;

};
TableCell.prototype.createCell = function (row,col,field,cacheDisabled) {

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
    var colLast = String(this.tableModel.header.fields.length - 1 === col);
    cell.setAttribute('col-last',colLast);

};
TableCell.prototype.updateCursorHeight = function () {

    var cursor = this.renderTo.querySelector(this.getFullClassSelector('row-cursor'));
    if(!cursor){
        return;
    }
    var tableModel = this.tableModel;
    var rowsTop = this.domCache.rowsTop,
        rowsHeight = this.domCache.rowsHeight,
        maxHeight = rowsHeight.maxHeight;

    var rows = tableModel.rows;
    for(var rowIndex = rowsHeight.length;rowIndex < rows.length;rowIndex++){
        var rowHeight = this._parseRowHeight(rows[rowIndex].height);
        rowsHeight[rowIndex] = rowHeight;
        maxHeight += rowHeight;
        rowsTop[rowIndex] = rowsTop[rowIndex - 1] + rowsHeight[rowIndex - 1];
    }

    cursor.style.top = rowsTop[rowsTop.length - 1] + rowsHeight[rowsHeight.length - 1] + 'px';

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

    this._reLayoutCursor();

    return cursor;

};
TableCell.prototype._reLayoutCursor = function () {

    var colsLeft = this.domCache.colsLeft,
        colsWidth = this.domCache.colsWidth,
        rowsTop = this.domCache.rowsTop,
        rowsHeight = this.domCache.rowsHeight;
    var cursor = this.cursor;
    cursor.style.top = rowsTop[rowsTop.length - 1] + rowsHeight[rowsHeight.length - 1] + 'px';
    cursor.style.width = colsLeft[colsLeft.length - 1] + colsWidth[colsWidth.length - 1] + 'px';

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
        var headerCell = this.createCell(0,index,field,true);
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
            this.executeFunctionDelay('refresh',this.refresh.bind(this));
        }
    }.bind(this));

    this.tableModel.bind('appendRows', function () {
        if(this.renderTo){
            this.executeFunctionDelay('updateCursorHeight',this.updateCursorHeight.bind(this));
        }
    }.bind(this));
};
TableCell.prototype.executeFunctionDelay = function (timeoutId,func) {

    cancelAnimationFrame(this._timeoutCache[timeoutId]);
    this._timeoutCache[timeoutId] = requestAnimationFrame(func);

};
TableCell.prototype._bindEvent = function () {

    var headerPanel = this.headerPanel,
        rowPanel = this.rowPanel;
    var headerContentPanel = headerPanel.querySelector(this.getFullClassSelector('header-content'));
    rowPanel.addEventListener('scroll', function () {

        var scrollLeft = rowPanel.scrollLeft;
        headerContentPanel.style.transform = 'translate3d(' + -scrollLeft + 'px' + ',0,0)';
        this.executeFunctionDelay('paintRequest',this.repaint.bind(this));

    }.bind(this));

};
export { TableCell }