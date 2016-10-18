/**
 * Created by koujp on 2016/10/17.
 */
import { TableModel } from '../model/TableModel';
function TableCell(tableModel){
    if(!(tableModel instanceof TableModel)){
        throw new TypeError('arguments must be instanceof TableModel !');
    }
    this.tableModel = tableModel;
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
    var tablePanel = document.createElement('div');
    tablePanel.className = this.getFullClassName();
    var dirtyPanel = renderTo.querySelector(this.getFullClassSelector());
    dirtyPanel && renderTo.removeChild(dirtyPanel);

    tablePanel.appendChild(this.createHeader());
    tablePanel.appendChild(this.createRowContainer());
    this.bindEvent();
    renderTo.appendChild(tablePanel);
};
TableCell.prototype.getPanelSize = function () {
    return {
        width:this.renderTo.clientWidth,
        height:this.renderTo.clientHeight
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
    if(lastArea == null){
        lastArea = curArea;
    }
    var areas = [];
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

    var rowClientArea = this.getCurrentRowArea(),
        colClientArea = this.getCurrentColArea();
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
    rows.forEach(function (row,index) {
        rowsHeight[index] = this.parseRowHeight(row.height);
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
    return cursor;
};
TableCell.prototype.createRowContainer = function () {
    var tableModel = this.tableModel;
    var rows = tableModel.rows;
    var rowContainer = document.createElement('div');
    rowContainer.className = this.getFullClassName('row-container');
    this.rowPanel = rowContainer;

    var cursor = this.createCursor();
    rowContainer.appendChild(cursor);

    var rowClientArea = this.getCurrentRowArea(),
        colClientArea = this.getCurrentColArea();
    this.rowClientArea = rowClientArea;
    var fields,cell;
    for(var rowIndex = rowClientArea.from;rowIndex < rowClientArea.from + rowClientArea.pageSize;rowIndex++){
        fields = rows[rowIndex].fields;
        for(var colIndex = colClientArea.from;colIndex < colClientArea.from + colClientArea.pageSize;colIndex++){
            cell = this.createCell(rowIndex,colIndex,fields[colIndex]);
            rowContainer.appendChild(cell);
        }
    }

    return rowContainer;
};
TableCell.prototype.parseColWidth = function (width) {
    var clientWidth = this.renderTo.clientWidth;
    if(typeof width === 'string' && width && width.indexOf('%') === width.length - 1){
        width = Math.floor(parseFloat(width)/100 * clientWidth);
    }else{
        width = parseInt(width);
    }
    return isNaN(width)?100:width;
};
TableCell.prototype.parseRowHeight = function (height) {

    if(typeof height === 'string' && height && height.indexOf('%') === height.length - 1){
        var clientHeight = this.renderTo.clientHeight;
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
    tableModel.header.forEach(function (field,index) {
        colsWidth[index] = this.parseColWidth(field.width);
        if(index === 0){
            colsLeft[index] = 0;
        }else{
            colsLeft[index] = colsLeft[index - 1] + colsWidth[index - 1];
        }
        var headerCell = this.createCell(0,index,field,true);
        headerContentPanel.appendChild(headerCell);

    }.bind(this));
    headerContainer.appendChild(headerContentPanel);
    return headerContainer;
};
TableCell.prototype.bindEvent = function () {
    var headerPanel = this.headerPanel,
        rowPanel = this.rowPanel;
    var headerContentPanel = headerPanel.querySelector(this.getFullClassSelector('header-content'));
    var timeout;
    var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(executor){
                return setTimeout(executor,1000/60);
            },
        cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.clearTimeout;
    rowPanel.addEventListener('scroll', function () {
        headerContentPanel.style.transform = 'translate3d(' + -rowPanel.scrollLeft + 'px' + ',0,0)';
        cancelAnimationFrame(timeout);
        timeout = requestAnimationFrame(function () {
            this.repaint();
        }.bind(this))

    }.bind(this));
};
export { TableCell }