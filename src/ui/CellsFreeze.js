import { style,getFullClassName,getFullClassSelector,isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'

var _prototype = {};
_prototype.render = function(){
    var contentPanel = this.bodyPanel._contentPanel;
    var freezeContainer = this._createFreezeContainer();
    contentPanel.appendChild(freezeContainer);
};
_prototype._createFreezeContainer = function(){

    var freezeCol = document.createElement('div');
    freezeCol.className = getFullClassName('freeze-col-container');

    var freezeRow = document.createElement('div');
    freezeRow.className = getFullClassName('freeze-row-container');

    var freezeCross = document.createElement('div');
    freezeCross.className = getFullClassName('freeze-cross-container');

    var freezeContainer = document.createElement('div');
    freezeContainer.className = getFullClassName('freeze-container');

    freezeContainer.appendChild(freezeCross);
    freezeContainer.appendChild(freezeCol);
    freezeContainer.appendChild(freezeRow);

    return freezeContainer;
};
_prototype._createHeaderFreezeContainer = function(){
    var freezeContainer = document.createElement('div');
    freezeContainer.className = getFullClassName('freeze-header-container');
    return freezeContainer;
};
_prototype.getFreezeHeaderPanel = function(){
    var selector = getFullClassSelector('freeze-header-container');
    return this.headerPanel.querySelector(selector);
};
_prototype._getFreezeColPanel = function(){
    var bodyPanel = this.bodyPanel;
    var selector = getFullClassSelector('freeze-col-container');
    return bodyPanel.querySelector(selector);
};
_prototype._getFreezeRowPanel = function(){
    var bodyPanel = this.bodyPanel;
    var selector = getFullClassSelector('freeze-row-container');
    return bodyPanel.querySelector(selector);
};
_prototype._getFreezeCrossPanel = function(){
    var bodyPanel = this.bodyPanel;
    var selector = getFullClassSelector('freeze-cross-container');
    return bodyPanel.querySelector(selector);
};
_prototype.paintFreezeRow = function(){


    var paintState = this.paintState,
        domCache = this.domCache;
    var blnFreezeRow = this._isFreezeRow();
    if(!blnFreezeRow){
        this.removeCells(domCache.freezeRowCells)
        return;
    }
    var colClientArea = paintState.currentColArea;

    var cacheCells = domCache.freezeRowCells;
    var cells = cacheCells.filter(function (cell) {
        var col = parseInt(cell.getAttribute('col'));
        var inCol = col >= colClientArea.from && col < colClientArea.from + colClientArea.pageSize;
        return !inCol;
    });

    var contentPanel = this._getFreezeRowPanel();

    var areas = this.getFreezeRowAreas();
    this._paintFreezeAreaCells(contentPanel,cells,cacheCells,areas);

};
_prototype._isFreezeCrossCellArea = function(rowIndex,colIndex){
    var cellsInstance = this.cellsInstance;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeCol = freezeConfig.col,
        freezeRow = freezeConfig.row;
    return rowIndex < freezeRow && colIndex < freezeCol;
};
_prototype._paintFreezeAreaCells = function(contentPanel,cells,cacheCells,areas){

    var cellsInstance = this.cellsInstance,
        rows = cellsInstance.cellsModel.rows;
    areas.forEach(function (area) {
        var row, cell, field;
        for (var rowIndex = area.top; rowIndex < area.bottom; rowIndex++) {
            row = rows[rowIndex];
            for (var colIndex = area.left; colIndex < area.right; colIndex++) {

                if(this._isFreezeCrossCellArea(rowIndex,colIndex)){
                    continue;
                }

                field = row.fields[colIndex];
                cell = cells.pop();
                if (!cell) {
                    cell = this._createCell(rowIndex, colIndex, field,cacheCells);
                    contentPanel.appendChild(cell);
                }
                this._paintCell(cell, rowIndex, colIndex, field);
            }
        }
    }.bind(this));

    this.removeCells(cacheCells, cells);
};
_prototype._isFreezeCol = function(){
    var cellsInstance = this.cellsInstance;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeCol = freezeConfig.col;

    var blnFreezeCol = typeof freezeCol === 'number' && freezeCol > 0;
    return blnFreezeCol;

};
_prototype._isFreezeRow = function(){
    var cellsInstance = this.cellsInstance;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeRow = freezeConfig.row;

    var blnFreezeRow = typeof freezeRow === 'number' && freezeRow > 0;
    return blnFreezeRow;
};
_prototype._isFreezeCross = function(){
    return this._isFreezeRow() && this._isFreezeCol();
};
_prototype.paintFreezeCol = function(){


    var paintState = this.paintState,
        domCache = this.domCache;

    var blnFreezeCol = this._isFreezeCol();
    if(!blnFreezeCol){
        this.removeCells(domCache.freezeColCells);
        return;
    }

    var rowClientArea = paintState.currentRowArea;

    var cacheCells = domCache.freezeColCells;
    var cells = cacheCells.filter(function (cell) {
        var row = parseInt(cell.getAttribute('row'));
        var inRow = row >= rowClientArea.from && row < rowClientArea.from + rowClientArea.pageSize;
        return !inRow;
    });

    var contentPanel = this._getFreezeColPanel();

    var areas = this.getFreezeColAreas();
    this._paintFreezeAreaCells(contentPanel,cells,cacheCells,areas);
};
_prototype.paintFreezeCross = function(){
    var cellsInstance = this.cellsInstance,
        rows = cellsInstance.cellsModel.rows;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeCol = freezeConfig.col,
        freezeRow = freezeConfig.row;

    var blnFreezeCross = this._isFreezeCross();
    var cacheCells = this.domCache.freezeCrossCells;
    if(!blnFreezeCross){
        this.removeCells(cacheCells);
        return;
    }

    if(cacheCells.length > 0){
        return;
    }
    var paintState = this.paintState;
    var rowPageSize = paintState.currentRowArea.pageSize,
        colPageSize = paintState.currentColArea.pageSize;

    freezeCol = Math.min(freezeCol,colPageSize);
    freezeRow = Math.min(freezeRow,rowPageSize);


    var freezePanel = this._getFreezeCrossPanel();
    var row,field,cell;
    for(var rowIndex = 0;rowIndex < freezeRow;rowIndex++){
        row = rows[rowIndex];
        for(var colIndex = 0;colIndex < freezeCol;colIndex++){
            field = row.fields[colIndex];
            cell = this._createHeaderCell(rowIndex, colIndex, field,cacheCells);
            this._paintCell(cell, rowIndex, colIndex, field);
            freezePanel.appendChild(cell);
        }
    }

};
_prototype.paintFreeze = function(){

    this.adjustScroll();
    this.paintFreezeHeader();
    this.paintFreezeCross();
    this.paintFreezeCol();
    this.paintFreezeRow();
};
_prototype.paintFreezeHeader = function(){

    var blnFreezeCol = this._isFreezeCol();
    var cacheCells = this.domCache.freezeHeaderCells;
    if(!blnFreezeCol){
        this.removeCells(cacheCells);
        return;
    }

    var cellsInstance = this.cellsInstance;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeCol = freezeConfig.col;

    var paintState = this.paintState;
    var colPageSize = paintState.currentColArea.pageSize;
    freezeCol = Math.min(freezeCol,colPageSize);

    var cellsModel = cellsInstance.cellsModel,
        headerFreezePanel = this.getFreezeHeaderPanel();

    if(cacheCells.length > 0){
        return;
    }

    var fields = cellsModel.header.fields;
    var field,cell;
    for(var i = 0;i < freezeCol;i++){
        field = fields[i];
        cell = this._createHeaderCell(0, i, field,cacheCells);
        this._paintCell(cell, 0, i, field);
        headerFreezePanel.appendChild(cell);
    }
};
_prototype.adjustFreezeRowScroll = function(){

    if(!this._isFreezeRow()){
        return;
    }
    var scroll = this.scrollTo();
    var rowPanel = this._getFreezeRowPanel();
    var css = {};
    if(this.isCustomScroll){
        css.left =  -scroll.scrollLeft + 'px';
    }else{
        css.top = scroll.scrollTop + 'px';
    }
    style(rowPanel,css);
};
_prototype.adjustFreezeColScroll = function(){

    if(!this._isFreezeCol()){
        return;
    }
    var scroll = this.scrollTo();
    var colPanel = this._getFreezeColPanel();
    var css = {};
    if(this.isCustomScroll){
        css.top =  -scroll.scrollTop + 'px';
    }else{
        css.left = scroll.scrollLeft + 'px';
    }
    style(colPanel,css);
};
_prototype.adjustFreezeCrossScroll = function(){

    if(!this._isFreezeCross()){
        return;
    }
    var scroll = this.scrollTo();
    var crossPanel = this._getFreezeCrossPanel();
    var css = {};
    if(!this.isCustomScroll){
        css.top =  scroll.scrollTop + 'px';
        css.left = scroll.scrollLeft + 'px';
    }
    style(crossPanel,css);
};
_prototype.adjustScroll = function(){
   this.adjustFreezeCrossScroll();
   this.adjustFreezeRowScroll();
   this.adjustFreezeColScroll();
};
_prototype.getFreezeRowAreas = function () {

    var cellsInstance = this.cellsInstance;
    var paintState = this.paintState;
    var rowPageSize = paintState.currentRowArea.pageSize;
    var colPaintAreas = [].concat(paintState.colPaintAreas);
    var areas = [];
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeRow = freezeConfig.row;

    freezeRow = Math.min(freezeRow,rowPageSize);
    colPaintAreas.forEach(function(colArea){
        var area = {
            top: 0,
            bottom: freezeRow,
            left: colArea.from,
            right: colArea.from + colArea.pageSize
        };
        areas.push(area);
    });
    return areas;
};
_prototype.getFreezeColAreas = function () {

    var cellsInstance = this.cellsInstance;
    var paintState = this.paintState;
    var colPageSize = paintState.currentColArea.pageSize;
    var rowPaintAreas = [].concat(paintState.rowPaintAreas);
    var areas = [];
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeCol = freezeConfig.col;

    freezeCol = Math.min(freezeCol,colPageSize);
    rowPaintAreas.forEach(function(rowArea){
        var area = {
            top: rowArea.from,
            bottom: rowArea.from + rowArea.pageSize,
            left: 0,
            right: freezeCol
        };
        areas.push(area);
    });
    return areas;
};
_prototype.getFreezeCells = function () {

    var domCache = this.domCache;
    return domCache.freezeRowCells.concat(domCache.freezeColCells).concat(domCache.freezeCrossCells).concat(domCache.freezeHeaderCells);
};
export { _prototype as CellsFreeze }