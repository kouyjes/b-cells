function ScrollConfig(config){
    this.scrollX = true;
    this.scrollY = true;
    this.autoHideX = true;
    this.autoHideY = true;
    this.width = 12;
    this.height = 12;
    this.hTrackColor = '';
    this.hScrollColor = '';
    this.vTrackColor = '';
    this.vScrollColor = '';
    this.timeout = 1300;
    if(config){
        Object.assign(this,config);
    }
}
ScrollConfig.defaultConfig = function () {
    return new ScrollConfig()
};
export { ScrollConfig }