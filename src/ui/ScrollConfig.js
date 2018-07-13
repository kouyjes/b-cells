function ScrollConfig(config){
    this.scrollX = true;
    this.scrollY = true;
    this.autoHide = true;
    this.width = 12;
    this.height = 12;
    this.hTrackColor = '';
    this.hScrollColor = '';
    this.vTrackColor = '';
    this.vScrollColor = '';
    if(config){
        Object.assign(this,config);
    }
}
ScrollConfig.defaultConfig = function () {
    return new ScrollConfig()
};
export { ScrollConfig }