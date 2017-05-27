/**
 * Created by koujp on 2016/10/17.
 */
import { CellsModel } from '../model/CellsModel';
import { CellsRender } from './CellsRender';
import { CellsEvent } from './CellsEvent';
import { CellsResize } from './CellsResize';
import { isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'
function _setRenderTo(renderTo) {

    if(typeof renderTo === 'string'){
        renderTo = document.querySelector(renderTo);
    }

    if(!isDomElement(renderTo)){
        throw new TypeError('renderTo must be a dom element !');
    }

    this.renderTo = renderTo;

};
if(!Object.assign){
    Object.assign = function (src,target) {
        if(!target){
            return src;
        }
        Object.keys(target).forEach(function (key) {
            src[key] = target[key];
        });
        return src;
    };
}
function Cells(cellsModel,config){

    init.apply(this,arguments);

}

var _initHooks = [];
Cells.addInitHooks = function (initHook) {

    var index = _initHooks.indexOf(initHook);
    if(index === -1){
        _initHooks.push(initHook);
    }

};
Cells.removeInitHooks = function (initHook) {

    var index = _initHooks.indexOf(initHook);
    if(index >= 0){
        _initHooks.splice(index,1);
    }

};

function init(cellsModel,config) {

    if(!(cellsModel instanceof CellsModel)){
        throw new TypeError('arguments must be instanceof CellsModel !');
    }
    Object.defineProperty(this,'cellsModel',{
        value:cellsModel
    });

    var renderTo = config.renderTo;
    delete config.renderTo;
    _setRenderTo.call(this,renderTo);


    this.config = Object.assign({
        enableCustomScroll:false,
        textTitle:false,
        colResize:false,
        rowResize:false,
        overflowX:false,
        overflowY:false
    },config);
    Object.freeze(this.config);


    var _ = this,initParams = arguments;
    var initHooks = this.initHooks || _initHooks;

    if(!initHooks){
        initHooks = _initHooks;
        this.initHooks = [].concat(initHooks);
    }

    initHooks.forEach(function (initHook) {
        try{
           initHook.apply(_,initParams);
        }catch(e){
            console.error(e);
        }
    });

    this._bindCellsModelEvent();


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
Cells.prototype._initPanelSize = function () {

    var cellsPanel = this.cellsPanel;

    cellsPanel.currentWidth = this.headerPanel.clientWidth;
    cellsPanel.currentHeight = cellsPanel.clientHeight;


};
Cells.prototype.getPanelSize = function () {

    return {
        width:this.cellsPanel.currentWidth,
        height:this.cellsPanel.currentHeight
    };

};

Cells.prototype._onAppendRows = function () {

    var rowsHeight = this.domCache.rowsHeight;
    this._initCellHeightIndex(rowsHeight.length);
    this.syncCursor();
    this.executeFunctionDelay('repaintRequest',this.repaint);

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
Cells.prototype._bindCellsModelEvent = function () {
    this.cellsModel.bind('refresh', function () {
        if(this.renderTo){
            this.executeFunctionDelay('refresh',this.repaint);
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
    Cells.addInitHooks(extend);
});

export { Cells }