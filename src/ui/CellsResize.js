import { userSelect,getFullClassName,getFullClassSelector,getMousePosition } from './domUtil'

function CellsResize(){

}
function isNumber(value){

    return typeof value === 'number';

}
CellsResize._updateRowDomCache = function (rowIndex,height) {

    if(!isNumber(rowIndex = parseFloat(rowIndex)) || !isNumber(height = parseFloat(height))){
        return;
    }
    height = Math.max(0,height);
    if(rowIndex === -1){
        this.cellsModel.header.height = height;
        return;
    }
    var domCache = this.domCache;
    var rowsHeight = domCache.rowsHeight,
        rowsTop = domCache.rowsTop;
    rowsHeight[rowIndex] = height;
    for(var i = rowIndex + 1;i < rowsTop.length;i++){
        rowsTop[i] = rowsTop[i - 1] + rowsHeight[i - 1];
    }
};
CellsResize._updateColDomCache = function (colIndex,width) {

    if(!isNumber(colIndex = parseFloat(colIndex)) || !isNumber(width = parseFloat(width))){
        return;
    }
    if(colIndex < 0){
        return;
    }
    var domCache = this.domCache;
    width = Math.max(0,width);
    var colsWidth = domCache.colsWidth,
        colsLeft = domCache.colsLeft;
    colsWidth[colIndex] = width;
    for(var i = colIndex + 1;i < colsLeft.length;i++){
        colsLeft[i] = colsLeft[i - 1] + colsWidth[i - 1];
    }

};
CellsResize._updateDomCache = function (rowIndex,colIndex,width,height) {

    this._updateRowDomCache(rowIndex,height);
    this._updateColDomCache(colIndex,width);

};
CellsResize.resizeRowHeight = function resizeRowHeight(rowIndex,height) {

    this.resizeCell(rowIndex,null,null,height);

};
CellsResize.resizeColWidth = function resizeColWidth(colIndex,width) {

    this.resizeCell(null,colIndex,width,null);

};

CellsResize._resizeCellDom = function _resizeCellDom(rowIndex,colIndex) {

    this._updateHeaderCells(colIndex,{
        row:rowIndex === -1,
        col:colIndex >= 0
    });

    this._updateBodyCells(rowIndex,colIndex,{
        row:rowIndex >= 0,
        col:colIndex >= 0
    });

};
CellsResize._updateBodyCells = function (rowIndex,colIndex,option) {

    var option = option || {
            row:false,
            col:false
        };
    if(!option.col && !option.row){
        return;
    }
    var domCache = this.domCache,
        rowsHeight = domCache.rowsHeight,
        rowsTop = domCache.rowsTop;
    var colsWidth = domCache.colsWidth,
        colsLeft = domCache.colsLeft;
    var cells = this.getBodyCells(),
        size = cells.length,
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
CellsResize._updateHeaderCells = function (colIndex,option) {

    var option = option || {
            row:false,
            col:false
        };
    if(option.row){
        this.headerPanel.style.height = this.cellsModel.header.height + 'px';
    }
    if(option.col){
        var domCache = this.domCache;
        var colsWidth = domCache.colsWidth,
            colsLeft = domCache.colsLeft;
        //update header col width
        var cells = this.getHeaderCells(),
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
CellsResize.resizeCell = function resizeCell(rowIndex,colIndex,width,height) {

    this._updateDomCache(rowIndex,colIndex,width,height);
    this._resizeCellDom(rowIndex,colIndex,width,height);

};
var mouseHit = 3,cursors = ['auto','ns-resize','ew-resize','nwse-resize'];
function _bindResizeBodyCellEvent() {

    var domCache = this.domCache,
        cellsPanel = this.cellsPanel,
        rowsTop = domCache.rowsTop,
        colsLeft = domCache.colsLeft,
        rowsHeight = domCache.rowsHeight,
        colsWidth = domCache.colsWidth;

    var _ = this;
    function getMouseInfo(e){

        var colResize = _.config.colResize,
            rowResize = _.config.rowResize;
        var position = getMousePosition(e,cellsPanel);

        var relY,relX;
        var rowHit = 0,colHit = 0,rowIndex = undefined,colIndex = undefined;

        var scrollTo = _.scrollTo();
        //header area
        if(rowResize){
            relY = position.pageY;
            var headerHeight = _.headerHeight();
            if(Math.abs(relY - headerHeight) < mouseHit){
                rowHit = 1;
                rowIndex = -1;
            }else{

                relY -= headerHeight;
                rowsTop.some(function (rowTop,index) {
                    var h = rowsHeight[index];
                    if(Math.abs(rowTop + h - scrollTo.scrollTop - relY) < mouseHit){
                        rowHit = 1;
                        rowIndex = index;
                        return true;
                    }
                });
            }
        }

        if(colResize){
            relX = position.pageX;
            colsLeft.some(function (colLeft,index) {
                var w = colsWidth[index];
                if(Math.abs(colLeft + w - scrollTo.scrollLeft - relX) < mouseHit){
                    colHit = 2;
                    colIndex = index;
                    return true;
                }
            });
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
    cellsPanel.addEventListener('mousemove', function (e) {
        this.executeFunctionDelay('rowPanel-mousemove',function () {
            var mouseInfo = getMouseInfo(e);
            cellsPanel.style.cursor = mouseInfo.cursor;
        });

    }.bind(this));

    cellsPanel.addEventListener('mousemove', function (e) {
        var mouseInfo = getMouseInfo(e);
        //resizeCell
        var rowIndex = resizeManager.rowIndex,
            colIndex = resizeManager.colIndex,
            width,height,
            resizeFlag = false;
        if(resizeManager.lastPageY  !== undefined){
            height = mouseInfo.position.pageY - resizeManager.lastPageY + (rowIndex === -1 ? this.headerHeight() : rowsHeight[rowIndex]);
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
            userSelect(false,this.cellsPanel);
        }

    }.bind(this));
    function mouseup(){
        userSelect(true,this.cellsPanel);
        if(resizeManager.reset()){
            this.syncCursor();
        }
    }
    cellsPanel.addEventListener('mouseup',mouseup.bind(this));
    cellsPanel.addEventListener('mouseleave',mouseup.bind(this))

};
Object.defineProperty(CellsResize,'init',{

    value: function () {
        this.extendBindEventExecutor(_bindResizeBodyCellEvent);
    }

});

export { CellsResize }