/**
 * Created by koujp on 2016/10/17.
 */
function CellsModel(cellsModel){
    this.header = {
        fields:[] //{name:''}
    };
    this.rows = [];//[{fields:[]}]

    this._eventListener = {
        onAppendRows:[],
        onRefresh:[]
    };

    if(arguments.length > 0){
        this.init(cellsModel);
    }
}
CellsModel.prototype.init = function (cellsModel) {
    if(cellsModel.header && cellsModel.header.fields instanceof Array){
        this.header.fields = cellsModel.header.fields;
    }
    if(cellsModel.rows instanceof Array){
        this.rows = cellsModel.rows;
    }
    var eventListener = cellsModel._eventListener;
    if(!eventListener){
        return;
    }
    var context = this;
    ['appendRows','refresh'].forEach(function (eventName) {
        var listeners = eventListener[this.getEventKey(eventName)];
        if(listeners instanceof Array){
            listeners.forEach(function (listener) {
                context.bind(eventName,listener);
            });
        }
    });
};
CellsModel.prototype.bind = function (eventName,listener) {
    if(typeof eventName !== 'string' || typeof listener !== 'function'){
        return;
    }
    eventName = this.getEventKey(eventName);
    if(eventName && this._eventListener[eventName].indexOf(listener) === -1){
        this._eventListener[eventName].push(listener);
    }
};
CellsModel.prototype.getEventKey = function (eventName) {
    if(eventName.length > 1){
        eventName = 'on' + eventName[0].toUpperCase()  + eventName.substring(1);
        if(this._eventListener[eventName] instanceof Array){
            return eventName;
        }
    }
    return null;
};
CellsModel.prototype.trigger = function (eventName) {
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
CellsModel.prototype.refresh = function () {
    this.trigger('refresh');
};
CellsModel.prototype.appendRows = function (rows) {
    this.rows = this.rows.concat(rows);
    this.trigger('appendRows');
};
export { CellsModel }