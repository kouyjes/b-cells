
var _config = {
    themesPrefix : 'd1012'
};
var global = {};
Object.defineProperty(global,'config',{

    get : function () {
        return _config;
    },
    set : function (config) {
        Object.assign(_config,config);
    }

});

export { global }