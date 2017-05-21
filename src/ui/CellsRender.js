import { getFullClassName,getFullClassSelector,getMousePosition,isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'
import { ScrollBar } from './ScrollBar'

var CellsRender = Object.create(null);

var headerContentClassName = 'header-content';

CellsRender.resizeScrollbar = function resizeScrollbar() {

    if(this.config.enableCustomScroll){
        this.scrollbar.resize();
        return;
    }

};
CellsRender.render = function render(renderTo) {

    this._setRenderTo(renderTo);
    this.refresh();

};
CellsRender.refresh = function refresh() {

    var _ = this;
    this.init();
    var renderTo = this.renderTo;
    if(!renderTo || renderTo.nodeType !== 1){
        throw new TypeError('parent container is invalid !');
    }

    var cellPanel = this.cellPanel = document.createElement('div');
    cellPanel.className = getFullClassName();
    var dirtyPanel = renderTo.querySelector(getFullClassSelector());
    dirtyPanel && renderTo.removeChild(dirtyPanel);

    cellPanel.appendChild(this._createHeader());

    cellPanel.appendChild(this._createBodyContainer());
    renderTo.appendChild(cellPanel);


    var scrollbar = this.config.enableCustomScroll ? new ScrollBar(this.bodyPanel,{
        overflowX:_.config.overflowX,
        overflowY:this.config.overflowY
    }) : this.bodyPanel;
    Object.defineProperty(this,'scrollbar',{
        get: function () {
            return scrollbar;
        }
    });

    this._createCursor();

    this._bindEvent();

    this.executeFunctionDelay('paintRequest',this.paint);


};
CellsRender.getCurrentColArea = function getCurrentColArea() {

    var scrollbar = this.scrollbar;
    var panelSize = this.getPanelSize();
    var colsLeft = this.domCache.colsLeft;
    var left = scrollbar.scrollLeft;
    return this.getThresholdArea(panelSize.width,colsLeft,left);

};

CellsRender.getThresholdArea = function getThresholdArea(viewSize,positions,cursor) {

    var from = 0,
        end,i;

    if(!positions.some(function (position,index) {
            if(position >= cursor){
                from = index;
                return true;
            }
        })){
        from = positions.length - 1;
    }
    var mid = from;
    for(i = mid;i >= 0;i--){
        if(positions[mid] - positions[i] >= viewSize){
            break;
        }
    }
    from = Math.max(0,i);
    for(i = mid;i < positions.length;i++){
        if(positions[i] - positions[mid] > viewSize){
            break;
        }
    }
    end = Math.min(positions.length,i);
    var area = {
        from:from,
        pageSize:Math.min(positions.length - from,Math.max(3,end - from))
    };
    return area;

};
CellsRender.getCurrentRowArea = function getCurrentRowArea() {

    var scrollbar = this.scrollbar;
    var panelSize = this.getPanelSize();
    var rowsTop = this.domCache.rowsTop;
    var top = scrollbar.scrollTop;
    return this.getThresholdArea(panelSize.height,rowsTop,top);

};
CellsRender.getRowPaintAreas = function getRowPaintAreas() {

    return this._getPaintAreas('row');

};
CellsRender.getColPaintAreas = function getColPaintAreas() {

    return this._getPaintAreas('col');

};
CellsRender._getPaintAreas = function _getPaintAreas(type) {

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
CellsRender.paint = function paint() {

    this._cachePanelSize();
    this._initCellSizeIndex();
    this.paintHeader();
    this.paintBody();
    this.syncCursor();

};
CellsRender.repaint = function repaint() {

    this.paintHeader();
    this.paintBody();

};
CellsRender.paintHeader = function paintHeader() {

    var cellsCache = this.domCache.headerCells,
        headerContentPanel = this.headerPanel.querySelector(getFullClassSelector(headerContentClassName))
    var colPaintAreas = this.getColPaintAreas(),
        colClientArea = colPaintAreas.currentArea;
    if(colPaintAreas.length === 0){
        colPaintAreas.push(colClientArea);
    }
    var cells = cellsCache.filter(function (cell) {
        var col = parseInt(cell.getAttribute('col'));
        var inCol = col >= colClientArea.from && col < colClientArea.from + colClientArea.pageSize;
        return inCol;
    });

    var fields = cellsModel.header.fields;
    colPaintAreas.forEach(function (colArea) {
        var cell,field;
        for(var colIndex = colArea.from;colIndex < colArea.from + colArea.pageSize;colIndex++){
            field = fields[colIndex];
            cell = cells.pop();
            if(!cell){
                cell = this._createCell(0,colIndex,field,cellsCache);
                cell._headerCell = true;
                headerContentPanel.appendChild(cell);
            }else{
                this._paintCell(cell,0,colIndex,field);
            }
        }
    }.bind(this));

    this.removeCells(cellsCache,cells);

};
CellsRender.paintBody = function paintBody() {

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

    this.removeCells(cacheCells,cells);

};
CellsRender.removeCells = function removeCells(cacheCells,cells) {

    cells.forEach(function (cell) {
        if(cell.parentNode){
            cell.parentNode.removeChild(cell);
            cacheCells.splice(cacheCells.indexOf(cell),1);
        }
    });

};
CellsRender.computeRowTop = function computeRowTop(row) {

    var rowsTop = this.domCache.rowsTop;
    return rowsTop[row];

};
CellsRender._paintCell = function _paintCell(cell,row,col,field) {

    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
    this._configCell(cell,field);
    this._reLayoutCell(cell);

};
CellsRender._configCell = function _configCell(cell,field) {

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
CellsRender._createCell = function _createCell(row,col,field,cacheCells) {

    var cacheCells = cacheCells || this.domCache.cells;
    var cell = document.createElement('div');
    cell._cell = true;
    this._configCell(cell,field);

    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
    var classNames = [getFullClassName('cell')];
    cell.className = classNames.join(' ');

    cacheCells.push(cell);

    this._reLayoutCell(cell);
    return cell;

};
CellsRender._reLayoutCell = function _reLayoutCell(cell) {

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
CellsRender._createCursor = function _createCursor() {

    var cursor = document.createElement('i');
    cursor.className = getFullClassName('row-cursor');

    this.cursor = cursor;
    this.rowPanel.appendChild(cursor);

    return cursor;

};
CellsRender._createBodyContainer = function _createBodyContainer() {

    var bodyContainer = this.bodyPanel = document.createElement('div');
    bodyContainer.className = getFullClassName('body-container');

    bodyContainer.setAttribute('overflowX',String(this.config.overflowX));
    bodyContainer.setAttribute('overflowY',String(this.config.overflowY))

    bodyContainer.appendChild(this._createRowContainer());
    return bodyContainer;
};
CellsRender._createRowContainer = function _createRowContainer() {

    var rowContainer = document.createElement('div');
    rowContainer.className = getFullClassName('row-container');
    this.rowPanel = rowContainer;
    return rowContainer;

};
CellsRender._createHeader = function _createHeader() {

    var cellsModel = this.cellsModel;
    var headerContainer = document.createElement('header');
    headerContainer.className = getFullClassName('header');
    this.headerPanel = headerContainer;
    this.headerHeight(cellsModel.header.height);

    var headerContentPanel = document.createElement('div');
    headerContentPanel.className = getFullClassName(headerContentClassName);

    headerContainer.appendChild(headerContentPanel);
    return headerContainer;

};
CellsRender.syncCursor = function syncCursor() {

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
export { CellsRender }