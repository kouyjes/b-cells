function ScrollBar(ele,config){
    this.init(ele,config);
}
function getWidth(ele){
    return ele.clientWidth;
}
function getScrollWidth(ele){
    return ele.scrollWidth;
}
function getHeight(ele){
    return ele.clientWidth;
}
function getScrollHeight(ele){
    return ele.scrollHeight;
}
ScrollBar.prototype.init = function (ele,config) {

    this.element = ele;
    this.overflowX = false;
    this.overflowY = false;
    this.config = Object.assign({
        width:18,
        height:18
    },config);

    var width = getWidth(this.element),height = getHeight(this.element),
        scrollWidth = getScrollWidth(this.element),scrollHeight = getScrollHeight(this.element);

};