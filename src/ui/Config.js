function Config(config){
    this.textTitle = false;
    this.colResize = false;
    this.rowResize = false;
    this.scrollX = true;
    this.scrollY = true;
    this.minCellWidth = 50;
    this.minCellHeight = 50;
    this.freezeConfig = {
        col:undefined,
        row:undefined
    };
    if(config){
        Object.assign(this,config);
    }
}
Config.defaultConfig = function () {
    return new Config()
};
export { Config }