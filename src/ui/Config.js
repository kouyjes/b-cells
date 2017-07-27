function Config(config){
    this.enableCustomScroll = false;
    this.textTitle = false;
    this.colResize = false;
    this.rowResize = false;
    this.scrollX = true;
    this.scrollY = true;
    this.minCellWidth = 50;
    this.minCellHeight = 50;
    if(config){
        Object.assign(this,config);
    }
}
Config.defaultConfig = function () {
    return new Config()
};
export { Config }