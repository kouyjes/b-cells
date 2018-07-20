import { userSelect,getFullClassName,getFullClassSelector,getMousePosition,executeFunctionDelay } from './domUtil'
import { Class } from '../base/Class';
import { Cells } from './Cells';
import { CellsEvent } from './CellsEvent';


var CellsResize = Class.create(function (cellsInstance) {

    this.cellsInstance = cellsInstance;

});
var _prototype = CellsResize.prototype;
function isNumber(value){

    return typeof value === 'number';

}
_prototype._updateRowDomCache = function (rowIndex,height) {

    if(!isNumber(rowIndex = parseFloat(rowIndex)) || !isNumber(height = parseFloat(height))){
        return;
    }
    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender,
        domCache = cellsRender.domCache;
    height = Math.max(cellsRender.getMinCellHeight(rowIndex),height);
    if(rowIndex === -1){
        domCache.headerHeight = height;
        return;
    }

    var rowsHeight = domCache.rowsHeight,
        rowsTop = domCache.rowsTop;
    rowsHeight[rowIndex] = height;
    for(var i = rowIndex + 1;i < rowsTop.length;i++){
        rowsTop[i] = rowsTop[i - 1] + rowsHeight[i - 1];
    }
};
_prototype._updateColDomCache = function (colIndex,width) {

    if(!isNumber(colIndex = parseFloat(colIndex)) || !isNumber(width = parseFloat(width))){
        return;
    }
    if(colIndex < 0){
        return;
    }
    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender;
    var domCache = cellsRender.domCache;


    width = Math.max(cellsRender.getMinCellWidth(colIndex),width);
    var colsWidth = domCache.colsWidth,
        colsLeft = domCache.colsLeft;
    colsWidth[colIndex] = width;
    for(var i = colIndex + 1;i < colsLeft.length;i++){
        colsLeft[i] = colsLeft[i - 1] + colsWidth[i - 1];
    }

};
_prototype._updateDomCache = function (rowIndex,colIndex,width,height) {

    this._updateRowDomCache(rowIndex,height);
    this._updateColDomCache(colIndex,width);

};
_prototype.resizeRowHeight = function resizeRowHeight(rowIndex,height) {

    this.resizeCell(rowIndex,null,null,height);

};
_prototype.resizeColWidth = function resizeColWidth(colIndex,width) {

    this.resizeCell(null,colIndex,width,null);

};

_prototype._resizeCellDom = function _resizeCellDom(rowIndex,colIndex) {

    this._updateHeaderCells(colIndex,{
        row:rowIndex === -1,
        col:colIndex >= 0
    });

    this._updateBodyCells(rowIndex,colIndex,{
        row:rowIndex >= 0,
        col:colIndex >= 0
    });

    this._updateFreezeCells(rowIndex,colIndex,{
        row:rowIndex >= 0,
        col:colIndex >= 0
    });
};
_prototype._updateBodyCells = function (rowIndex,colIndex,option) {
    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender;
    this._updateContentCells(cellsRender.getBodyCells(),rowIndex,colIndex,option);
};
_prototype._updateFreezeCells = function (rowIndex,colIndex,option) {
    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender;
    this._updateContentCells(cellsRender.getFreezeCells(),rowIndex,colIndex,option);
};
_prototype._updateContentCells = function (cells,rowIndex,colIndex,option) {

    var option = option || {
            row:false,
            col:false
        };
    if(!option.col && !option.row){
        return;
    }
    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender;
    var domCache = cellsRender.domCache,
        rowsHeight = domCache.rowsHeight,
        rowsTop = domCache.rowsTop;
    var colsWidth = domCache.colsWidth,
        colsLeft = domCache.colsLeft;
    var size = cells.length,
        cell,row,col;
    for(var i = 0;i < size;i++){
        cell = cells[i];

        if(option.row){
            row = parseInt(cell.getAttribute('row'));
            if(row === rowIndex){
                cell.style.height = rowsHeight[row] + 'px';
            }else if(row > rowIndex){
                cell.style.top = rowsTop[row] + 'px';
            }
        }

        if(option.col){
            col = parseInt(cell.getAttribute('col'));
            if(col === colIndex){
                cell.style.width = colsWidth[col] + 'px';
            }else if(col > colIndex){
                cell.style.left = colsLeft[col] + 'px';
            }
        }
    }

};
_prototype._updateHeaderCells = function (colIndex,option) {

    var option = option || {
            row:false,
            col:false
        };

    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender,
        domCache = cellsRender.domCache;

    if(option.row){
        cellsInstance.headerHeight(domCache.headerHeight);
    }
    if(option.col){
        var colsWidth = domCache.colsWidth,
            colsLeft = domCache.colsLeft;
        //update header col width
        var cells = cellsRender.getHeaderCells(),
            size = cells.length;

        var cell,col;
        for(var i = 0;i < size;i++){
            cell = cells[i];
            col = parseInt(cell.getAttribute('col'));
            if(col === colIndex){
                cell.style.width = colsWidth[col] + 'px';
            }else if(col > colIndex){
                cell.style.left = colsLeft[col] + 'px';
            }
        }
    }
};
_prototype.resizeCell = function resizeCell(rowIndex,colIndex,width,height) {

    this._updateDomCache(rowIndex,colIndex,width,height);
    this._resizeCellDom(rowIndex,colIndex,width,height);

};
var mouseHit = 3,cursors = ['auto','ns-resize','ew-resize','nwse-resize'];
function _bindResizeCellEvent() {

    var cellsInstance = this.cellsInstance,
        cellsRender = cellsInstance.cellsRender;
    var domCache = cellsRender.domCache,
        cellsPanel = cellsRender.cellsPanel,
        rowsTop = domCache.rowsTop,
        colsLeft = domCache.colsLeft,
        rowsHeight = domCache.rowsHeight,
        colsWidth = domCache.colsWidth;

    var _ = this;
    function getMouseInfo(e){

        var colResize = cellsInstance.config.colResize,
            rowResize = cellsInstance.config.rowResize;

        var freezeConfig = cellsInstance.config.freezeConfig,
            freezeRow = freezeConfig.row,
            freezeCol = freezeConfig.col;

        var headerResize = cellsInstance.config.headerResize;

        var position = getMousePosition(e,cellsPanel);

        var scrollTo = cellsRender.scrollTo();
        var headerHeight = cellsInstance.headerHeight();

        var rowHit = 0,colHit = 0,rowIndex = undefined,colIndex = undefined;

        var loop = function(){ return {} };
        var getRowHitConfig = loop;
        if(rowResize){
            getRowHitConfig = function(scrollTop,freezeRow){
                var relY = position.pageY;
                var rowHit = 0,rowIndex = undefined;
                var freeze = false;

                var isFreezeRow = typeof freezeRow === 'number' && freezeRow > 0;
                if(headerResize && Math.abs(relY - headerHeight) < mouseHit){
                    rowHit = 1;
                    rowIndex = -1;
                }else if(headerHeight > relY){
                }else{
                    relY -= headerHeight;
                    if(isFreezeRow){
                        var top = rowsTop[freezeRow - 1] + rowsHeight[freezeRow - 1];
                        freeze = (top + mouseHit >= relY);
                    }
                    (!isFreezeRow || (freeze  && freezeConfig.rowResize)) && rowsTop.some(function (rowTop,index) {
                        if(index >= freezeRow){
                            return true;
                        }
                        var h = rowsHeight[index];
                        if(Math.abs(rowTop + h - scrollTop - relY) < mouseHit){
                            rowHit = 1;
                            rowIndex = index;
                            return true;
                        }
                    });
                }
                return {
                    freeze:freeze,
                    rowHit:rowHit,
                    rowIndex:rowIndex
                };
            };
        }


        var getColHitConfig = loop;
        if(colResize){
            getColHitConfig = function(scrollLeft,freezeCol){
                var isFreezeCol = typeof freezeCol === 'number' && freezeCol > 0;
                var relX = position.pageX;
                var colHit = 0,colIndex = undefined;
                var freeze = false;
                if(isFreezeCol){
                    var left = colsLeft[freezeCol - 1] + colsWidth[freezeCol - 1];
                    freeze = (left + mouseHit >= relX);
                }
                (!isFreezeCol || (freeze && freezeConfig.colResize)) && colsLeft.some(function (colLeft,index) {
                    if(index >= freezeCol){
                        return true;
                    }
                    var w = colsWidth[index];
                    if(Math.abs(colLeft + w - scrollLeft - relX) < mouseHit){
                        colHit = 2;
                        colIndex = index;
                        return true;
                    }
                });
                return {
                    freeze:freeze,
                    colHit:colHit,
                    colIndex:colIndex
                };
            };
        }

        //header area
        if(rowResize){
            var rowHitConfig;
            if(freezeRow > 0){
                rowHitConfig = getRowHitConfig(0,freezeRow);
            }
            if(!rowHitConfig || (!rowHitConfig.freeze && rowHitConfig.rowIndex === undefined)){
                rowHitConfig = getRowHitConfig(scrollTo.scrollTop);
            }
            rowHit = rowHitConfig.rowHit;
            rowIndex = rowHitConfig.rowIndex;
        }

        if(colResize){
            var colHitConfig;
            if(freezeCol > 0){
                colHitConfig = getColHitConfig(0,freezeCol);
            }
            if(!colHitConfig || (!colHitConfig.freeze && colHitConfig.colIndex === undefined)){
                colHitConfig = getColHitConfig(scrollTo.scrollLeft);
            }
            colHit = colHitConfig.colHit;
            colIndex = colHitConfig.colIndex;
        }

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
    var id = this._id;
    cellsPanel.addEventListener('mousemove', function (e) {
        var key = id + 'rowPanel-mousemove';
        executeFunctionDelay(key,function () {
            var mouseInfo = getMouseInfo(e);
            cellsPanel.style.cursor = mouseInfo.cursor;
        });

    }.bind(this));

    cellsPanel.addEventListener('mousemove', function (e) {

        var cellsInstance = this.cellsInstance;
        var cellsEvent = cellsInstance.cellsEvent,
            cellsPanel = cellsInstance.cellsPanel;
        var mouseInfo = getMouseInfo(e);
        //resizeCell
        var rowIndex = resizeManager.rowIndex,
            colIndex = resizeManager.colIndex,
            width,height,
            resizeFlag = false;
        if(resizeManager.lastPageY  !== undefined){
            height = mouseInfo.position.pageY - resizeManager.lastPageY + (rowIndex === -1 ? cellsInstance.headerHeight() : rowsHeight[rowIndex]);
            resizeManager.lastPageY = mouseInfo.position.pageY;
            resizeFlag = true;
        }

        if(resizeManager.lastPageX !== undefined){
            width = mouseInfo.position.pageX - resizeManager.lastPageX + colsWidth[colIndex];
            resizeManager.lastPageX = mouseInfo.position.pageX;
            resizeFlag = true;
        }
        if(resizeFlag){
            var event = CellsEvent.createEvent('cellResize', cellsPanel, {
                rowIndex:rowIndex,
                colIndex:colIndex,
                width:width,
                height:height
            },e);
            this.resizeCell(rowIndex,colIndex,width,height);
            cellsEvent.triggerEvent(event);
            e.stopPropagation();
        }
    }.bind(this));


    cellsPanel.addEventListener('mousedown', function (e) {

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
        if(resizeFlag){
            userSelect(false,cellsPanel);
        }

    }.bind(this));
    function mouseup(){
        userSelect(true,cellsPanel);
        if(resizeManager.reset()){
            cellsRender.syncCursor();
        }
    }
    cellsPanel.addEventListener('mouseup',mouseup.bind(this));
    cellsPanel.addEventListener('mouseleave',mouseup.bind(this))

};
_prototype.bindEvent = function () {
    _bindResizeCellEvent.call(this);
};
Cells.addInitHooks(function () {
    this.cellsResize = new CellsResize(this);
    this.addEventListener('renderFinished', function () {
        this.cellsResize.bindEvent();
    }.bind(this));
});

export { CellsResize }