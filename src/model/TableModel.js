/**
 * Created by koujp on 2016/10/17.
 */
function TableModel(tableModel){
    this.header = [];//{name:''}
    this.rows = [];//[{fields:[]}]

    this._eventListener = {
        onCellLoad:[],
        onCellUnload:[],
        onRefresh:[]
    };

    if(arguments.length > 0){
        this.init(tableModel);
    }
}
TableModel.prototype.init = function (tableModel) {
    if(tableModel.header instanceof Array){
        this.header = tableModel.header;
    }
    if(tableModel.rows instanceof Array){
        this.rows = tableModel.rows;
    }
    var eventListener = tableModel._eventListener;
    if(!eventListener){
        return;
    }
    var context = this;
    ['cellLoad','cellUnload','refresh'].forEach(function (eventName) {
        var listeners = eventListener[this.getEventKey(eventName)];
        if(listeners instanceof Array){
            listeners.forEach(function (listener) {
                context.bind(eventName,listener);
            });
        }
    });
};
TableModel.prototype.bind = function (eventName,listener) {
    if(typeof eventName !== 'string' || typeof listener !== 'function'){
        return;
    }
    eventName = this.getEventKey(eventName);
    if(eventName && this._eventListener[eventName].indexOf(listener) === -1){
        this._eventListener[eventName].push(listener);
    }
};
TableModel.prototype.getEventKey = function (eventName) {
    if(eventName.length > 1){
        eventName = 'on' + eventName[0].toUpperCase()  + eventName.substring(1);
        if(this._eventListener[eventName] instanceof Array){
            return eventName;
        }
    }
    return null;
};
TableModel.prototype.trigger = function (eventName) {
    eventName = this.getEventKey(eventName);
    var listeners = this._eventListener[eventName];
    if(!(listeners instanceof Array)){
        return;
    }
    listeners.forEach(function (listener) {
        try{
            if(typeof listener === 'function'){
                listener();
            }
        }catch(e) {}
    });
};
TableModel.prototype.refresh = function () {
    this.trigger('refresh');
};
export { TableModel }