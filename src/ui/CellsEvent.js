import { getFullClassName,getFullClassSelector,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'
import { Class } from '../base/Class';
import { Cells } from './Cells';

var CellsEvent = Class.create(function (cellsInstance) {

    this.cellsInstance = cellsInstance;
    Object.defineProperty(this,'eventManager',{
        value:{}
    });

});
var _prototype = CellsEvent.prototype;
_prototype.extendEventType = function (eventType,listeners) {

    if(!listeners){
        listeners = [];
    }else{
        listeners = [].concat(listeners);
    }
    if(!this.eventManager[eventType]){
        this.eventManager[eventType] = listeners;
    }

};
_prototype.getEventListeners = function (eventType) {

    return this.eventManager[eventType] || [];

};
_prototype.existEventListener = function (eventType) {

    var listeners = this.eventManager[eventType];
    return listeners && listeners.length > 0;

};
CellsEvent.createEvent = function createEvent(eventType,target,data) {

    return {
        type:eventType,
        target:target,
        data:data
    };

};
_prototype.addEventListener = function addEventListener(eventType,func) {

    var handlers = this.eventManager[eventType];
    if(!handlers){
        handlers = this.eventManager[eventType] = [];
    }
    if(handlers.indexOf(func) === -1){
        handlers.push(func);
    }
    return this;
};
_prototype.removeEventListener = function removeEventListener(eventType,func) {

    var handlers = this.eventManager[eventType];
    if(!handlers){
        return;
    }
    var index = handlers.indexOf(func);
    if(index >= 0){
        handlers.splice(index,1);
        return func;
    }

};
_prototype.triggerEvent = function triggerEvent(event) {

    var eventType = event.type;
    var handlers = this.eventManager[eventType];
    if(!handlers){
        return;
    }
    handlers.forEach(function (handler) {
        requestAnimationFrame(function () {
            handler.call(event.target,event);
        });
    }.bind(this));

};
Cells.publishMethod(['addEventListener','removeEventListener','triggerEvent'],'cellsEvent');
Cells.addInitHooks(function () {
    this.cellsEvent = new CellsEvent(this);
});

export { CellsEvent }