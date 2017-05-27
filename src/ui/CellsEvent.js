import { getFullClassName,getFullClassSelector,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'

function CellsEvent(){

    Object.defineProperty(this,'eventManager',{
        value:{
            click:[], //cells click event
            cellClick:[], //cell click event
            scroll:[], // scroll event
            cellPainted:[], //triggered after cell has been painted
        }
    });

}

var bindEventExecutors = [];
CellsEvent.extendBindEventExecutor = function (executor) {

    if(bindEventExecutors.indexOf(executor) === -1){
        bindEventExecutors.push(executor);
    }

};
CellsEvent.extendEventType = function (eventType,listeners) {

    if(!listeners){
        listeners = [];
    }else{
        listeners = [].concat(listeners);
    }
    if(!this.eventManager[eventType]){
        this.eventManager[eventType] = listeners;
    }

};
CellsEvent.createEvent = function createEvent(eventType,target,data) {

    return {
        type:eventType,
        target:target,
        data:data
    };

};
CellsEvent.tiggerCellClickEvent = function tiggerCellClickEvent(cell) {

    var cellsModel = this.cellsModel,col = parseInt(cell.getAttribute('col'));
    if(cell._headerCell){
        this.triggerEvent(this.createEvent('cellClick',cell,cellsModel.header.fields[col]));
        return;
    }
    var row = parseInt(cell.getAttribute('row'));
    var rowData = cellsModel.rows[row];
    if(rowData){
        this.triggerEvent(this.createEvent('cellClick',cell,rowData.fields[col]));
    }
};
CellsEvent.addEventListener = function addEventListener(eventType,func) {

    var handlers = this.eventManager[eventType];
    if(!handlers){
        handlers = this.eventManager[eventType] = [];
    }
    if(handlers.indexOf(func) === -1){
        handlers.push(func);
    }
    return this;
};
CellsEvent.removeEventListener = function removeEventListener(eventType,func) {

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
CellsEvent.triggerEvent = function triggerEvent(event) {

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

function _bindClickEvent() {

    var _ = this,cellsPanel = this.cellsPanel;
    cellsPanel.addEventListener('click', function (e) {

        var target = e.target;
        if(target === cellsPanel){
            _.triggerEvent(_.createEvent('click',cellsPanel,_.cellsModel));
            return;
        }
        if(_.eventManager.cellClick && _.eventManager.cellClick.length >= 0){
            if(target._cell){
                _.tiggerCellClickEvent(target);
            }else{
                while(target = target.parentNode){
                    if(target === cellsPanel){
                        break;
                    }
                    if(target._cell){
                        _.tiggerCellClickEvent(target);
                        break;
                    }
                }
            }
        }
        _.triggerEvent(_.createEvent('click',cellsPanel,_.cellsModel));
    });

};

CellsEvent._bindEvent = function _bindEvent() {

    var _ = this;
    bindEventExecutors.forEach(function (executor) {
        try{
            executor.call(_);
        }catch(e){
            console.error(e);
        }
    });

};

Object.defineProperty(CellsEvent,'init',{

    value: function () {
        this.extendBindEventExecutor(_bindClickEvent);
    }

});



export { CellsEvent }