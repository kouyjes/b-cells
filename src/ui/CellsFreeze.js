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
_prototype._getFreezeColPanel = function(){
    var contentPanel = this.bodyPanel._contentPanel;
    var selector = getFullClassSelector('freeze-col-container');
    return contentPanel.querySelector(selector);
};
_prototype._getFreezeRowPanel = function(){
    var contentPanel = this.bodyPanel._contentPanel;
    var selector = getFullClassSelector('freeze-row-container');
    return contentPanel.querySelector(selector);
};
_prototype._getFreezeCrossPanel = function(){
    var contentPanel = this.bodyPanel._contentPanel;
    var selector = getFullClassSelector('freeze-cross-container');
    return contentPanel.querySelector(selector);
};
_prototype.paintFreezeRow = function(){
    var cellsInstance = this.cellsInstance;
    var freezeConfig = cellsInstance.config.freezeConfig,
        freezeRow = freezeConfig.row;

    var blnFreezeRow = typeof freezeRow === 'number' && freezeRow >= 0;
    if(!blnFreezeRow){
        return;
    }
    var panel = this._getFreezeRowPanel();
    var paintState = this.paintState;
    var colPaintAreas = paintState.colPaintAreas;

};
_prototype.paintFreezeCol = function(){
    var cellsInstance = this.cellsInstance;
    var panel = this._getFreezeColPanel();
};
_prototype.paintFreezeCross = function(){
    var cellsInstance = this.cellsInstance;
    var panel = this._getFreezeCrossPanel();
};
_prototype.paintFreeze = function(){
    this.paintFreezeCross();
    this.paintFreezeCol();
    this.paintFreezeRow();
};

export { _prototype as CellsFreeze }