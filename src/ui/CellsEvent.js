import { getFullClassName,getFullClassSelector,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'

var CellsEvent = Object.create(null);

var bindEventExecutors = [];
CellsEvent.extendBindEventExecutor = function (executor) {

    if(bindEventExecutors.indexOf(executor) === -1){
        bindEventExecutors.push(executor);
    }

};
CellsEvent.createEvent = function createEvent(eventType,target,data) {

    return {
        type:eventType,
        target:target,
        data:data
    };

};
CellsEvent.tiggerCellEvent = function triggerCellEvent(cell) {

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
};
CellsEvent.removeEventListener = function removeEventListener(eventType,func) {

    var handlers = this.eventManager[eventType];
    if(!handlers){
        return;
    }
    var index = handlers.indexOf(func);
    if(index >= 0){
        handlers.splice(index,1);
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
function _bindScrollEvent(){
    var headerPanel = this.headerPanel,
        scrollbar = this.scrollbar;
    var headerContentPanel = headerPanel.querySelector(getFullClassSelector('header-content'));
    scrollbar.addEventListener('scroll', function () {

        var scrollLeft = scrollbar.scrollLeft;
        headerContentPanel.style.left = -scrollLeft + 'px'

        this.executeFunctionDelay('repaintRequest',this.repaint);

    }.bind(this));
}


function _bindClickEvent() {

    var _ = this,cellPanel = this.cellPanel;
    cellPanel.addEventListener('click', function (e) {

        var target = e.target;
        if(target === cellPanel){
            _.tiggerCellEvent(_.createEvent('click',target,_.cellsModel));
            return;
        }
        if(_.eventManager.cellClick && _.eventManager.cellClick.length >= 0){
            if(target._cell){
                _.tiggerCellEvent(target);
            }else{
                while(target = target.parentNode){
                    if(target === cellPanel){
                        break;
                    }
                    if(target._cell){
                        _.tiggerCellEvent(target);
                        break;
                    }
                }
            }
        }
        _.triggerEvent(_.createEvent('click',target,_.cellsModel));
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
        this.extendBindEventExecutor(_bindScrollEvent);
        this.extendBindEventExecutor(_bindClickEvent);
    }

});



export { CellsEvent }