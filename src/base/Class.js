
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
function Class(){

}
var __instanceId__ = 1;
Class.create = function (baseClass) {
    var base = new Class();
    var _initHooks = [];
    var clazz = function () {

        Object.defineProperty(this,'_id',{
            value:'_instance_' + (__instanceId__++)
        });

        var args = arguments;
        if(typeof baseClass === 'function'){
            baseClass.apply(this,args);
        }else{
            Object.keys(baseClass).forEach(function (key) {
                this[key] = baseClass[key];
            }.bind(this));
        }
        _initHooks.forEach(function (initHook) {
            try{
                initHook.apply(this,args);
            }catch(e){
                console.log(e.stack || e);
            }
        }.bind(this));
    };
    clazz.addInitHooks = function (initHook) {

        var index = _initHooks.indexOf(initHook);
        if(index === -1){
            _initHooks.push(initHook);
        }

    };
    clazz.removeInitHooks = function (initHook) {

        var index = _initHooks.indexOf(initHook);
        if(index >= 0){
            _initHooks.splice(index,1);
        }

    };
    clazz.extend = function(extend,override){
        var _prototype = clazz.prototype;
        if(override === undefined || override === null){
            override = true;
        }
        Object.keys(extend).forEach(function(key){
            if(!override && (key in _prototype)){
                return;
            }
            _prototype[key] = extend[key];
        });
    };
    clazz.prototype = base;
    return clazz;
};

export { Class }