/**
 * Created by koujp on 2016/10/17.
 */
import { Class } from '../base/Class';
import { CellsModel } from '../model/CellsModel';
import { Config } from './Config';
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
var Cells = Class.create(function (cellsModel,config) {
    init.apply(this,arguments);
});
var _toString_ = Object.prototype.toString,
    _noonObj_ = {};
function isPlainObject(obj) {
    return _toString_.call(obj) === _toString_.call(_noonObj_);
}
function assignConfig(config,newConfig) {
    Object.keys(newConfig).forEach(function(key){
        var val = config[key],newVal = newConfig[key];
        if(isPlainObject(newVal)){
            if(!isPlainObject(val)){
                config[key] = newVal;
            }else{
                newVal = assignConfig(val,newVal);
            }
        }
        config[key] = newVal;
    });
    return config;
}
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


    this.config = assignConfig(Config.defaultConfig(),config);
    Object.freeze(this.config);


};

Cells.addDestroyHooks(function(){
    this.renderTo = null;
    var cellsModel = this.cellsModel;
    if(cellsModel){
        cellsModel.destroy();
    }
});
var _prototype = Cells.prototype;

Cells.publishMethod = function (methodNames,instanceName) {

    if(!methodNames || !instanceName){
        return;
    }
    methodNames = [].concat(methodNames);
    methodNames.forEach(function (methodName) {
        _prototype[methodName] = function () {
            var context = this[instanceName];
            var method = typeof methodName === 'function' ? methodName : context[methodName];
            if(typeof method === 'function'){
                return method.apply(context,arguments);
            }
        };
    });
};

export { Cells }