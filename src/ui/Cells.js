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

    this.config = Object.assign(Config.defaultConfig(),config);
    Object.freeze(this.config);


};
var _prototype = Cells.prototype;
Cells.extend = function (extend) {

    Object.keys(arguments[0]).forEach(function (key) {
        _prototype[key] = extend[key];
    });

};
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