/**
 * Created by koujp on 2016/10/17.
 */
import { CellsModel } from '../model/CellsModel';
import { CellsRender } from './CellsRender';
import { CellsEvent } from './CellsEvent';
import { CellsResize } from './CellsResize';
import { isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'

function Cells(cellsModel,config){

    if(!(cellsModel instanceof CellsModel)){
        throw new TypeError('arguments must be instanceof CellsModel !');
    }
    Object.defineProperty(this,'cellsModel',{
        value:cellsModel
    });

    this.config = Object.assign({
        enableCustomScroll:false,
        textTitle:false,
        colResize:false,
        rowResize:false,
        overflowX:false,
        overflowY:false
    },config);
    Object.freeze(this.config);

    this._bindCellsModelEvent();

}
Cells.prototype.themesPrefix = 'd1012';
Cells.prototype.init = function () {

    this.cellPanel = null;
    this.headerPanel = null;
    this.bodyPanel = null;
    this.rowPanel = null;
    this.cursor = null;

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

    Object.defineProperty(this,'eventManager',{
        value:{
            click:[], //cells click event
            cellClick:[] //cell click event
        }
    });


};

Cells.prototype._setRenderTo = function (renderTo) {

    if(typeof renderTo === 'string'){
        renderTo = document.querySelector(renderTo);
    }

    if(!isDomElement(renderTo)){
        throw new TypeError('renderTo must be a dom element !');
    }

    this.renderTo = renderTo;

};
Cells.prototype.scrollTo = function (scrollTop,scrollLeft) {

    var scrollbar = this.scrollbar;

    if(arguments.length === 0){
        return {
            scrollLeft:scrollbar.scrollLeft,
            scrollTop:scrollbar.scrollTop
        };
    }
    scrollbar.scrollLeft = scrollLeft;
    scrollbar.scrollTop = scrollTop;

};
Cells.prototype._cachePanelSize = function () {

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
Cells.prototype.getPanelSize = function () {

    return {
        width:this.renderTo.currentWidth,
        height:this.renderTo.currentHeight
    };

};

Cells.prototype._onAppendRows = function () {

    var rowsHeight = this.domCache.rowsHeight;
    this._initCellHeightIndex(rowsHeight.length);
    this.syncCursor();
    this.executeFunctionDelay('repaintRequest',this.repaint);

};
Cells.prototype.resizeScrollbar = function () {

    if(this.config.enableCustomScroll){
        this.scrollbar.resize();
        return;
    }

};
Cells.prototype._initCellSizeIndex = function () {

    this._initCellWidthIndex();
    this._initCellHeightIndex();

};
Cells.prototype._initCellWidthIndex = function () {

    var colsWidth = this.domCache.colsWidth,
        colsLeft = this.domCache.colsLeft;

    var maxWidth = 0;
    cellsModel.header.fields.forEach(function (field,index) {
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
Cells.prototype._initCellHeightIndex = function (startIndex) {

    startIndex = startIndex || 0;

    var cellsModel = this.cellsModel;
    var rows = cellsModel.rows;
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
Cells.prototype._parseCellWidth = function (width) {

    var panelSize = this.getPanelSize();
    var clientWidth = panelSize.width;
    if(typeof width === 'string' && width && width.indexOf('%') === width.length - 1){
        width = Math.floor(parseFloat(width)/100 * clientWidth);
    }else{
        width = parseInt(width);
    }
    return isNaN(width)?100:width;

};
Cells.prototype._parseCellHeight = function (height) {

    if(typeof height === 'string' && height && height.indexOf('%') === height.length - 1){
        var clientHeight = this.getPanelSize().height;
        height = Math.floor(parseFloat(height)/100 * clientHeight);
    }else{
        height = parseInt(height);
    }
    return height?height:30;

};
Cells.prototype.headerHeight = function (height) {

    var cellsModel = this.cellsModel;
    if(!height){
        return cellsModel.header.height;
    }
    height = parseInt(height);
    if(typeof height === 'number'){
        height = height + 'px';
    }
    cellsModel.header.height = height;
    this.headerPanel.style.height = height;
};
Cells.prototype._bindCellsModelEvent = function () {
    this.cellsModel.bind('refresh', function () {
        if(this.renderTo){
            this.executeFunctionDelay('refresh',this.refresh);
        }
    }.bind(this));

    this.cellsModel.bind('appendRows', function () {
        if(this.renderTo){
            this.executeFunctionDelay('appendRows',this._onAppendRows);
        }
    }.bind(this));
};
Cells.prototype.executeFunctionDelay = function (timeoutId,func,context) {

    return executeFunctionDelay(timeoutId,func,context || this);

};
Cells.prototype._updateDomCache = function (rowIndex,colIndex,width,height) {

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


var _prototype = Cells.prototype;
[CellsRender,CellsEvent,CellsResize].forEach(function (extend) {
    Object.keys(extend).forEach(function (key) {
        _prototype[key] = extend[key]
    });
});
[CellsRender,CellsEvent,CellsResize].forEach(function (extend) {
    if(typeof extend.init === 'function'){
        extend.init.call(_prototype);
    }
});

export { Cells }