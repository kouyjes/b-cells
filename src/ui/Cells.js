/**
 * Created by koujp on 2016/10/17.
 */
import { CellsModel } from '../model/CellsModel';
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

    this._bindCellsModelEvent();

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


};
var _prototype = Cells.prototype;
Cells.extend = function (methodName,method) {
    if(arguments.length === 1 && arguments[0]){
        Object.keys(arguments[0]).forEach(function (key) {
            _prototype[key] = arguments[0][key];
        });
    }
};

export { Cells }