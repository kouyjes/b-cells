import { getFullClassName,getFullClassSelector,getMousePosition,isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'
import { ScrollBar } from './ScrollBar'
function CellsRender(){

    this.cellsPanel = null;
    this.headerPanel = null;
    this.bodyPanel = null;
    this.cursor = null;

}
function initRenderState() {

    this.paintState = {
        lastRowArea:null,
        currentRowArea:null,
        lastColArea:null,
        currentColArea:null,
        rowPaintAreas:null,
        colPaintAreas:null,
        reset: function () {
            this.lastRowArea = null;
            this.currentRowArea = null;
            this.lastColArea = null;
            this.currentColArea = null;
            this.rowPaintAreas = null;
            this.colPaintAreas = null;
        }
    };
    this.domCache = {
        clearCells: function () {
            this.headerCells.length = 0;
            this.cells.length = 0;
        },
        headerCells:[],
        cells:[],
        colsWidth:[],
        colsLeft:[],
        rowsTop:[],
        rowsHeight:[]
    };

};
function initRender() {


    initRenderState.call(this);

    var _ = this;
    var renderTo = this.renderTo;
    if(!renderTo || renderTo.nodeType !== 1){
        throw new TypeError('parent container is invalid !');
    }

    var cellsPanel = this.cellsPanel = document.createElement('div');
    cellsPanel.className = getFullClassName();
    var dirtyPanel = renderTo.querySelector(getFullClassSelector());
    dirtyPanel && renderTo.removeChild(dirtyPanel);

    cellsPanel.appendChild(this._createHeader());

    cellsPanel.appendChild(this._createBodyContainer());
    renderTo.appendChild(cellsPanel);


    var scrollbar = this.config.enableCustomScroll ? new ScrollBar(this.bodyPanel,{
        overflowX:_.config.overflowX,
        overflowY:_.config.overflowY
    }) : this.bodyPanel;
    Object.defineProperty(this,'scrollbar',{
        configurable:true,
        get: function () {
            return scrollbar;
        }
    });

    this._createCursor();

    this._bindEvent();


};
var headerContentClassName = 'header-content';
CellsRender.resizeScrollbar = function resizeScrollbar() {

    if(this.config.enableCustomScroll){
        this.scrollbar.resize();
        return;
    }

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
        pageSize:end - from
    };
    return this.normalizeArea(area,positions);

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
CellsRender.normalizeArea = function (area,positions) {

    area.from = Math.max(0,area.from);
    area.from = Math.min(positions.length - 1,area.from);
    area.pageSize = Math.max(0,area.pageSize);
    area.pageSize = Math.min(positions.length - area.from,area.pageSize);
    return area;
};
CellsRender._getPaintAreas = function _getPaintAreas(type) {

    var paintState = this.paintState;
    var lastArea = type === 'row' ? paintState.lastRowArea : paintState.lastColArea,
        curArea = type === 'row' ? paintState.currentRowArea : paintState.currentColArea;

    var domCache = this.domCache;

    var positions = type === 'row' ? domCache.rowsTop : domCache.colsLeft;

    var areas = [];
    if(lastArea == null){
        areas.push(curArea);
        return areas;
    }

    if(lastArea.from === curArea.from && lastArea.pageSize === curArea.pageSize){
        return areas;
    }
    var area;
    if(curArea.from >= lastArea.from){

        if(lastArea.from + lastArea.pageSize <= curArea.from){
            areas.push(curArea);
        }else{
            area = this.normalizeArea({
                from:lastArea.from + lastArea.pageSize,
                pageSize:curArea.from + curArea.pageSize - (lastArea.from + lastArea.pageSize)
            },positions);
            if(area.pageSize > 0){
                areas.push(area);
            }

        }

    }else{

        if(curArea.from + curArea.pageSize <= lastArea.from){
            areas.push(curArea);
        }else{
            area = this.normalizeArea({
                from:curArea.from,
                pageSize:lastArea.from - curArea.from
            },positions);
            if(area.pageSize > 0){
                areas.push(area);
            }
            var bottomDis = curArea.from + curArea.pageSize - (lastArea.from + lastArea.pageSize);
            if(bottomDis > 0){

                area = this.normalizeArea({
                    from:lastArea.from + lastArea.pageSize,
                    pageSize:bottomDis
                },positions);
                if(area.pageSize > 0){
                    areas.push(area);
                }

            }
        }

    }
    return areas;

};
CellsRender.render = function render() {


    initRender.apply(this);

    this._initPanelSize();
    this._initCellSizeIndex();
    this.executePaint();
    this.syncCursor();

};
CellsRender.initPaint = function () {

    var domCache = this.domCache;
    var cells = this.renderTo.querySelectorAll(getFullClassSelector('cell')),
        size = cells.length;
    for(var i = 0;i < size;i++){
        cells[i].remove();
    }
    domCache.clearCells();
    var paintState = this.paintState;
    paintState.reset();

};
CellsRender.executePaint = function () {

    var paintState = this.paintState;
    paintState.currentRowArea = this.getCurrentRowArea();
    paintState.currentColArea = this.getCurrentColArea();
    paintState.rowPaintAreas = this.getRowPaintAreas();
    paintState.colPaintAreas = this.getColPaintAreas();
    this.paintHeader();
    this.paintBody();
    paintState.lastRowArea = paintState.currentRowArea;
    paintState.lastColArea = paintState.currentColArea;

};
CellsRender.paint = function paint() {

    this.initPaint();

    this._initPanelSize();
    this._initCellSizeIndex();
    this.executePaint();
    this.syncCursor();

};
CellsRender.repaint = function repaint() {

    this.executePaint();

};
CellsRender.getHeaderContentPanel = function () {

    var headerContentPanel = this.headerPanel.querySelector(getFullClassSelector(headerContentClassName))
    return headerContentPanel;
};
CellsRender.getHeaderCells = function () {

    return this.domCache.headerCells;

};
CellsRender.getBodyCells = function () {

    return this.domCache.cells;

};
CellsRender.paintHeader = function paintHeader() {

    var cellsCache = this.domCache.headerCells,
        headerContentPanel = this.getHeaderContentPanel();

    var paintState = this.paintState;
    var colPaintAreas = [].concat(paintState.colPaintAreas),
        colClientArea = paintState.currentColArea;


    var cells = cellsCache.filter(function (cell) {
        var col = parseInt(cell.getAttribute('col'));
        var inCol = col >= colClientArea.from && col < colClientArea.from + colClientArea.pageSize;
        return !inCol;
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

    var paintState = this.paintState,
        domCache = this.domCache,
        rows = this.cellsModel.rows;
    var rowPaintAreas = [].concat(paintState.rowPaintAreas),
        colPaintAreas = [].concat(paintState.colPaintAreas);

    var rowClientArea = paintState.currentRowArea,
        colClientArea = paintState.currentColArea;

    var cacheCells = domCache.cells;
    var cells = cacheCells.filter(function (cell) {
        var r = parseInt(cell.getAttribute('row')),
            col = parseInt(cell.getAttribute('col'));
        var inRow = r >= rowClientArea.from && r < rowClientArea.from + rowClientArea.pageSize,
            inCol = col >= colClientArea.from && col < colClientArea.from + colClientArea.pageSize;
        return !inRow || !inCol;
    });

    if(rowPaintAreas.length === 0 && colPaintAreas.length === 0){
        this.removeCells(cacheCells,cells);
        return;
    }

    if(rowPaintAreas.length === 0){
        rowPaintAreas.push(rowClientArea);
    }

    if(colPaintAreas.length === 0){
        colPaintAreas.push(colClientArea);
    }

    var contentPanel = this.bodyPanel._contentPanel;
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
                        contentPanel.appendChild(cell);
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
        cacheCells.splice(cacheCells.indexOf(cell),1);
        cell.remove();
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

    cell.setAttribute('row','' + row);
    cell.setAttribute('col','' + col);
    var classNames = [getFullClassName('cell')];
    cell.className = classNames.join(' ');

    this._configCell(cell,field);

    this._reLayoutCell(cell);

    cacheCells.push(cell);


    return cell;

};
CellsRender._reLayoutCell = function _reLayoutCell(cell) {

    var row = parseInt(cell.getAttribute('row')),
        col = parseInt(cell.getAttribute('col'));
    var domCache = this.domCache,
        colsLeft = domCache.colsLeft,
        colsWidth = domCache.colsWidth,
        rowsHeight = domCache.rowsHeight;

    //last column flag
    var cellsModel = this.cellsModel,
        headerFields = cellsModel.header.fields,
        rows = cellsModel.rows;
    var colLast = String(headerFields.length - 1 === col),
        rowLast = String(rows.length - 1 === row);
    cell.setAttribute('col-last',colLast);
    cell.setAttribute('row-last',rowLast);

    cell.style.top = this.computeRowTop(row) + 'px';
    cell.style.left = colsLeft[col] + 'px';
    cell.style.width = colsWidth[col] + 'px';
    cell.style.height = rowsHeight[row] + 'px';

};
CellsRender._createCursor = function _createCursor() {

    var cursor = document.createElement('i');
    cursor.className = getFullClassName('row-cursor');

    this.cursor = cursor;
    this.bodyPanel._contentPanel.appendChild(cursor);

    return cursor;

};
CellsRender._createBodyContainer = function _createBodyContainer() {

    var bodyContainer = this.bodyPanel = document.createElement('div');
    bodyContainer.className = getFullClassName('body-container');

    bodyContainer.setAttribute('overflowX',String(this.config.overflowX));
    bodyContainer.setAttribute('overflowY',String(this.config.overflowY))

    var rowContainer = this._createRowContainer();
    bodyContainer.appendChild(rowContainer);

    bodyContainer._contentPanel = rowContainer;
    return bodyContainer;
};
CellsRender._createRowContainer = function _createRowContainer() {

    var rowContainer = document.createElement('div');
    rowContainer.className = getFullClassName('row-container');
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

    headerContainer._contentPanel = headerContentPanel;
    return headerContainer;

};
CellsRender.syncCursor = function syncCursor() {

    var cursor = this.cursor;
    if(!cursor){
        return;
    }
    var domCache = this.domCache;
    var rowsTop = domCache.rowsTop,
        rowsHeight = domCache.rowsHeight,
        colsLeft = domCache.colsLeft,
        colsWidth = domCache.colsWidth;
    var curTop = rowsTop[rowsTop.length - 1] + rowsHeight[rowsHeight.length - 1],
        curWidth = colsLeft[colsLeft.length - 1] + colsWidth[colsWidth.length - 1];
    cursor.style.top = curTop + 'px';
    cursor.style.width = curWidth + 'px';

    this.executeFunctionDelay('resizeScrollbar',this.resizeScrollbar);

};
function _bindScrollEvent(){
    var headerPanel = this.headerPanel,
        scrollbar = this.scrollbar;
    var headerContentPanel = headerPanel.querySelector(getFullClassSelector('header-content'));
    scrollbar.addEventListener('scroll', function () {

        var scrollLeft = scrollbar.scrollLeft;
        headerContentPanel.style.left = -scrollLeft + 'px'
        this.executeFunctionDelay('repaintRequest',this.repaint);

        var event = this.createEvent('scroll',scrollbar,this.cellsModel);
        this.triggerEvent(event);

    }.bind(this));
}
Object.defineProperty(CellsRender,'init',{

    value: function () {
        this.extendBindEventExecutor(_bindScrollEvent);
    }

});
export { CellsRender }