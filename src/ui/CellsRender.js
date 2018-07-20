import { style,getFullClassName,getFullClassSelector,getMousePosition,isDomElement,requestAnimationFrame,cancelAnimationFrame,executeFunctionDelay } from './domUtil'
import { Class } from '../base/Class';
import { Cells } from './Cells';
import { CellsEvent } from './CellsEvent';
import { ScrollBar } from './ScrollBar';
import { CellsFreeze } from './CellsFreeze';
var _cellSupportStyles = ['background', 'backgroundColor', 'backgroundImage', 'backgroundRepeat', 'backgroundSize'];


var CellsRender = Class.create(function (cellsInstance) {

    this.cellsInstance = cellsInstance;

    this.cellsPanel = null;
    this.headerPanel = null;
    this.bodyPanel = null;
    this.cursor = null;

    var cellsEvent = cellsInstance.cellsEvent;
    cellsEvent.extendEventType('renderFinished', []);
    cellsEvent.extendEventType('click', []);
    cellsEvent.extendEventType('cellClick', []);
    cellsEvent.extendEventType('scroll', []);
    cellsEvent.extendEventType('cellPainted', []);

});

CellsRender.extend(CellsFreeze);

var _prototype = CellsRender.prototype;
function transformStyleName(styleName) {
    return styleName.replace(/-(\w)/g, function (match, str) {
        return str ? str.toUpperCase() : '';
    });
}
CellsRender.expandSupportStyles = function (styleNames) {
    if (styleNames) {
        styleNames = [].concat(styleNames);
    }
    styleNames.forEach(function (styleName) {
        styleName = transformStyleName[styleName];
        if (_cellSupportStyles.indexOf(styleName) === -1) {
            _cellSupportStyles.push(styleName);
        }
    });
};
_prototype.initRenderState = function () {

    this.paintState = {
        lastRowArea: null,
        currentRowArea: null,
        lastColArea: null,
        currentColArea: null,
        rowPaintAreas: null,
        colPaintAreas: null,
        reset: function () {
            this.lastRowArea = null;
            this.currentRowArea = null;
            this.lastColArea = null;
            this.currentColArea = null;
            this.rowPaintAreas = null;
            this.colPaintAreas = null;
        }
    };
    this.domCache = {
        clearCells: function () {
            this.headerCells.length = 0;
            this.cells.length = 0;
            this.freezeHeaderCells.length = 0;
            this.freezeRowCells.length = 0;
            this.freezeColCells.length = 0;
            this.freezeCrossCells.length = 0;
        },
        headerCells: [],
        cells: [],
        freezeHeaderCells:[],
        freezeRowCells:[],
        freezeColCells:[],
        freezeCrossCells:[],
        colsWidth: [],
        colsLeft: [],
        rowsTop: [],
        rowsHeight: [],
        headerHeight: 0,
    };

};
function initRender() {

    var cellsInstance = this.cellsInstance;
    this.initRenderState();
    var renderTo = cellsInstance.renderTo;
    if (!renderTo || renderTo.nodeType !== 1) {
        throw new TypeError('parent container is invalid !');
    }

    var cellsPanel = this.cellsPanel = document.createElement('div');
    cellsPanel.className = getFullClassName();
    var dirtyPanel = renderTo.querySelector(getFullClassSelector());
    dirtyPanel && renderTo.removeChild(dirtyPanel);

    cellsPanel.appendChild(this._createHeader());

    cellsPanel.appendChild(this._createBodyContainer());
    renderTo.appendChild(cellsPanel);

    var config = cellsInstance.config;
    var customScroll = config.customScroll;
    var scrollbar;
    if (customScroll) {
        var scrollOption = Object.assign({}, customScroll);
        scrollOption.scrollX = config.scrollX;
        scrollOption.scrollY = config.scrollY;
        scrollbar = new ScrollBar(this.bodyPanel, scrollOption);
    } else {
        scrollbar = this.bodyPanel;
    }
    Object.defineProperty(this,'isCustomScroll',{
        value:!!customScroll
    });
    Object.defineProperty(this, 'scrollbar', {
        configurable: true,
        get: function () {
            return scrollbar;
        }
    });

    this._createCursor();

    this.bindEvent();

};
var headerContentClassName = 'header-content';
_prototype._initPanelSize = function () {

    var cellsPanel = this.cellsPanel;

    cellsPanel.currentWidth = this.headerPanel.clientWidth;
    cellsPanel.currentHeight = cellsPanel.clientHeight;


};
_prototype.getPanelSize = function () {

    return {
        width: this.cellsPanel.currentWidth,
        height: this.cellsPanel.currentHeight
    };

};
_prototype.computeScrollbarState = function(){
    var scrollbar = this.scrollbar;
    if(scrollbar !== this.bodyPanel){
        return;
    }
    var style = window.getComputedStyle(scrollbar);
    var leftBorderW = parseInt(style.borderLeftWidth),
        rightBorderW = parseInt(style.borderRightWidth),
        topBorderW = parseInt(style.borderTopWidth),
        bottomBorderW = parseInt(style.borderBottomWidth);

    var scrollWidth = scrollbar.scrollWidth,
        offsetWidth = scrollbar.offsetWidth,
        scrollHeight = scrollbar.scrollHeight,
        offsetHeight = scrollbar.offsetHeight;
    var scrollX = scrollWidth + leftBorderW + rightBorderW > offsetWidth;
    var scrollY = scrollHeight + topBorderW + bottomBorderW > offsetHeight;
    scrollbar.setAttribute('scrollX',String(scrollX));
    scrollbar.setAttribute('scrollY',String(scrollY));
};
_prototype.resizeScrollbar = function resizeScrollbar() {

    var cellsInstance = this.cellsInstance;
    if (cellsInstance.config.customScroll) {
        this.scrollbar.resize();
        return;
    }

};
_prototype.getCurrentColArea = function getCurrentColArea() {

    var scrollbar = this.scrollbar;
    var panelSize = this.getPanelSize();
    var colsLeft = this.domCache.colsLeft;
    var left = scrollbar.scrollLeft;
    return this.getThresholdArea(panelSize.width, colsLeft, left);

};

_prototype.getThresholdArea = function getThresholdArea(viewSize, positions, cursor) {

    var from = 0,
        end, i;

    if (!positions.some(function (position, index) {
            if (position >= cursor) {
                from = index;
                return true;
            }
        })) {
        from = positions.length - 1;
    }
    var mid = from;
    for (i = mid; i >= 0; i--) {
        if (positions[mid] - positions[i] >= viewSize) {
            break;
        }
    }
    from = Math.max(0, i);
    for (i = mid; i < positions.length; i++) {
        if (positions[i] - positions[mid] > viewSize) {
            break;
        }
    }
    end = Math.min(positions.length, i);

    var area = {
        from: from,
        pageSize: end - from
    };
    return this.normalizeArea(area, positions);

};
_prototype.getCurrentRowArea = function getCurrentRowArea() {

    var scrollbar = this.scrollbar;
    var panelSize = this.getPanelSize();
    var rowsTop = this.domCache.rowsTop;
    var top = scrollbar.scrollTop;
    return this.getThresholdArea(panelSize.height, rowsTop, top);

};
_prototype.getRowPaintAreas = function getRowPaintAreas() {

    return this._getPaintAreas('row');

};
_prototype.getColPaintAreas = function getColPaintAreas() {

    return this._getPaintAreas('col');

};
_prototype.normalizeArea = function (area, positions) {

    area.from = Math.max(0, area.from);
    area.from = Math.min(positions.length - 1, area.from);
    area.pageSize = Math.max(0, area.pageSize);
    area.pageSize = Math.min(positions.length - area.from, area.pageSize);
    return area;
};
_prototype._getPaintAreas = function _getPaintAreas(type) {

    var paintState = this.paintState;
    var lastArea = type === 'row' ? paintState.lastRowArea : paintState.lastColArea,
        curArea = type === 'row' ? paintState.currentRowArea : paintState.currentColArea;

    var domCache = this.domCache;

    var positions = type === 'row' ? domCache.rowsTop : domCache.colsLeft;

    var areas = [];
    if (lastArea == null) {
        areas.push(curArea);
        return areas;
    }

    if (lastArea.from === curArea.from && lastArea.pageSize === curArea.pageSize) {
        return areas;
    }
    var area;
    if (curArea.from >= lastArea.from) {

        if (lastArea.from + lastArea.pageSize <= curArea.from) {
            areas.push(curArea);
        } else {
            area = this.normalizeArea({
                from: lastArea.from + lastArea.pageSize,
                pageSize: curArea.from + curArea.pageSize - (lastArea.from + lastArea.pageSize)
            }, positions);
            if (area.pageSize > 0) {
                areas.push(area);
            }

        }

    } else {

        if (curArea.from + curArea.pageSize <= lastArea.from) {
            areas.push(curArea);
        } else {
            area = this.normalizeArea({
                from: curArea.from,
                pageSize: lastArea.from - curArea.from
            }, positions);
            if (area.pageSize > 0) {
                areas.push(area);
            }
            var bottomDis = curArea.from + curArea.pageSize - (lastArea.from + lastArea.pageSize);
            if (bottomDis > 0) {

                area = this.normalizeArea({
                    from: lastArea.from + lastArea.pageSize,
                    pageSize: bottomDis
                }, positions);
                if (area.pageSize > 0) {
                    areas.push(area);
                }

            }
        }

    }
    return areas;

};
_prototype.initPaint = function () {

    var cellsInstance = this.cellsInstance;
    var domCache = this.domCache;
    var cells = cellsInstance.renderTo.querySelectorAll(getFullClassSelector('cell')),
        size = cells.length;
    for (var i = 0; i < size; i++) {
        this.removeElementFromDom(cells[i]);
    }
    domCache.clearCells();
    var paintState = this.paintState;
    paintState.reset();

};
_prototype.executePaint = function () {

    var paintState = this.paintState;
    paintState.currentRowArea = this.getCurrentRowArea();
    paintState.currentColArea = this.getCurrentColArea();
    paintState.rowPaintAreas = this.getRowPaintAreas();
    paintState.colPaintAreas = this.getColPaintAreas();
    this.paintHeader();
    this.paintFreeze();
    this.paintBody();
    paintState.lastRowArea = paintState.currentRowArea;
    paintState.lastColArea = paintState.currentColArea;

};
_prototype.getHeaderContentPanel = function () {

    var headerContentPanel = this.headerPanel._contentPanel;
    return headerContentPanel;
};
_prototype.getHeaderCells = function () {

    return this.domCache.headerCells;

};
_prototype.getBodyCells = function () {

    return this.domCache.cells;

};
_prototype.paintHeader = function paintHeader() {

    var cellsInstance = this.cellsInstance,
        cellsModel = cellsInstance.cellsModel,
        cellsCache = this.domCache.headerCells,
        headerContentPanel = this.getHeaderContentPanel();

    var paintState = this.paintState;
    var colPaintAreas = [].concat(paintState.colPaintAreas),
        colClientArea = paintState.currentColArea;


    var cells = cellsCache.filter(function (cell) {
        var col = parseInt(cell.getAttribute('col'));
        var inCol = col >= colClientArea.from && col < colClientArea.from + colClientArea.pageSize;
        return !inCol;
    });

    var fields = cellsModel.header.fields;
    colPaintAreas.forEach(function (colArea) {
        var cell, field;
        for (var colIndex = colArea.from; colIndex < colArea.from + colArea.pageSize; colIndex++) {
            field = fields[colIndex];
            cell = cells.pop();
            if (!cell) {
                cell = this._createHeaderCell(0, colIndex, field);
                headerContentPanel.appendChild(cell);
            } else {
                this._paintCell(cell, 0, colIndex, field);
            }
        }
    }.bind(this));

    this.removeCells(cellsCache, cells);

};
_prototype.getBodyPaintRectAreas = function () {
    var paintState = this.paintState;
    var rowPaintAreas = [].concat(paintState.rowPaintAreas),
        colPaintAreas = [].concat(paintState.colPaintAreas);
    var rowClientArea = paintState.currentRowArea,
        colClientArea = paintState.currentColArea;
    var areas = [];
    rowPaintAreas.forEach(function (rowArea) {
        colPaintAreas.forEach(function (colArea) {
            var area = {
                top: rowArea.from,
                bottom: rowArea.from + rowArea.pageSize,
                left: colArea.from,
                right: colArea.from + colArea.pageSize
            };
            areas.push(area);
        });
    });
    paintState.lastColArea !== null && rowPaintAreas.forEach(function (rowArea) {
        var area = {
            top: rowArea.from,
            bottom: rowArea.from + rowArea.pageSize,
            left: colClientArea.from,
            right: colClientArea.from + colClientArea.pageSize
        };
        areas.push(area);
    });
    paintState.lastRowArea !== null && colPaintAreas.forEach(function (colArea) {
        var area = {
            top: rowClientArea.from,
            bottom: rowClientArea.from + rowClientArea.pageSize,
            left: colArea.from,
            right: colArea.from + colArea.pageSize
        };
        areas.push(area);
    });

    return areas;

};
_prototype.paintBody = function paintBody() {

    var cellsInstance = this.cellsInstance;
    var paintState = this.paintState,
        domCache = this.domCache,
        rows = cellsInstance.cellsModel.rows;

    var rowClientArea = paintState.currentRowArea,
        colClientArea = paintState.currentColArea;

    var cacheCells = domCache.cells;
    var cells = cacheCells.filter(function (cell) {
        var r = parseInt(cell.getAttribute('row')),
            col = parseInt(cell.getAttribute('col'));
        var inRow = r >= rowClientArea.from && r < rowClientArea.from + rowClientArea.pageSize,
            inCol = col >= colClientArea.from && col < colClientArea.from + colClientArea.pageSize;
        return !inRow || !inCol;
    });


    var contentPanel = this.bodyPanel._contentPanel;

    var areas = this.getBodyPaintRectAreas();
    areas.forEach(function (area) {
        var row, cell, field;
        for (var rowIndex = area.top; rowIndex < area.bottom; rowIndex++) {
            row = rows[rowIndex];
            for (var colIndex = area.left; colIndex < area.right; colIndex++) {
                field = row.fields[colIndex];
                cell = cells.pop();
                if (!cell) {
                    cell = this._createCell(rowIndex, colIndex, field);
                    contentPanel.appendChild(cell);
                } else {
                    this._paintCell(cell, rowIndex, colIndex, field);
                }
            }
        }
    }.bind(this));

    this.removeCells(cacheCells, cells);

};
_prototype.removeCells = function removeCells(cacheCells, cells) {

    var _ = this;
    cells = cells || cacheCells;
    cells.forEach(function (cell) {
        var index = cacheCells.indexOf(cell);
        if(index !== -1){
            cacheCells.splice(index, 1);
        }
        _.removeElementFromDom(cell);
    });

};
_prototype.removeElementFromDom = function (cell) {

    if (cell.remove) {
        cell.remove();
    } else if (cell.parentNode) {
        cell.parentNode.removeChild(cell);
    }

};
_prototype.computeRowTop = function computeRowTop(row) {

    var rowsTop = this.domCache.rowsTop;
    return rowsTop[row];

};
_prototype._paintCell = function _paintCell(cell, row, col, field) {

    cell.setAttribute('row', '' + row);
    cell.setAttribute('col', '' + col);
    this._configCell(cell, field);
    this._reLayoutCell(cell);

};
_prototype.emptyElement = function (element) {
    while (element.firstChild) {
        this.removeElementFromDom(element.firstChild);
    }
};
function isDomNode(object) {
    if (typeof object !== 'object') {
        return false;
    }
    return object.nodeType !== void 0 && object.tagName !== void 0;
};
function parseDom(text){
    if (typeof text === 'object' && isDomNode(text)) {
        return [text];
    }
    else if (typeof text === 'string') {
        var div = document.createElement('div');
        div.innerHTML = text;
        return Array.prototype.slice.call(div.childNodes);
    }else if(text instanceof Array){
        if(text.every(function(node){
                return isDomNode(node);
            })){
            return text;
        }
    }
    throw new Error('invalid data !');

}
_prototype._configCell = function _configCell(cell, field) {

    var cellsInstance = this.cellsInstance;
    if(typeof field.render === 'function'){
        field.render(cell);
        return;
    }
    var isHtml = (field.html !== null && field.html !== undefined);
    cell.setAttribute('html_content', isHtml + '');
    if (isHtml) {
        cell.innerHTML = '';
        parseDom(field.html).forEach(function (node) {
            cell.appendChild(node);
        });
        cell._textSpan = null;
    } else {
        var text = field.name || field.value || '';
        var span;
        if (!cell._textSpan) {
            cell.innerHTML = '';
            span = document.createElement('span');
            cell.appendChild(span);
            cell._textSpan = span;
        } else {
            span = cell._textSpan;
        }
        span.innerText = text;
        if (cellsInstance.config.textTitle) {
            cell.setAttribute('title', text);
        }
    }
    return cell;

};
_prototype._createHeaderCell = function (row, col, field,cells) {

    var cell = this._createCell(row, col, field, cells || this.domCache.headerCells);
    cell._headerCell = true;
    return cell;

};
_prototype._createCell = function _createCell(row, col, field, cacheCells) {

    var cacheCells = cacheCells || this.domCache.cells;
    var cell = document.createElement('div');
    cell._cell = true;

    cell.setAttribute('row', '' + row);
    cell.setAttribute('col', '' + col);
    var classNames = [getFullClassName('cell')];
    cell.className = classNames.join(' ');

    this._configCell(cell, field);

    this._reLayoutCell(cell);

    cacheCells.push(cell);


    return cell;

};
_prototype._reLayoutCell = function _reLayoutCell(cell) {

    var cellsInstance = this.cellsInstance;
    var row = parseInt(cell.getAttribute('row')),
        col = parseInt(cell.getAttribute('col'));
    var domCache = this.domCache,
        colsLeft = domCache.colsLeft,
        colsWidth = domCache.colsWidth,
        rowsHeight = domCache.rowsHeight;

    //last column flag
    var cellsModel = cellsInstance.cellsModel,
        headerFields = cellsModel.header.fields,
        rows = cellsModel.rows,
        header = cellsModel.header;
    var colLast = String(headerFields.length - 1 === col),
        rowLast = String(rows.length - 1 === row);
    cell.setAttribute('col-last', colLast);
    cell.setAttribute('row-last', rowLast);

    style(cell, {
        left: colsLeft[col] + 'px',
        top: this.computeRowTop(row) + 'px',
        width: colsWidth[col] + 'px',
        height: rowsHeight[row] + 'px'
    });

    if (cell._customStyleKeys) {
        cell._customStyleKeys.forEach(function (key) {
            style(cell, key, '');
        });
    }

    var fields = cell._headerCell ? header.fields : rows[row].fields,
        field = fields[col];

    var fieldStyle = field.style;
    var customStyleKeys = [];
    if (fieldStyle) {
        Object.keys(fieldStyle).forEach(function (key) {
            if (key in cell.style) {
                if (_cellSupportStyles.indexOf(transformStyleName(key)) === -1) {
                    return;
                }
                style(cell, key, fieldStyle[key]);
                customStyleKeys.push(key);
            }
        });
    }
    cell._customStyleKeys = customStyleKeys;

};
_prototype._createCursor = function _createCursor() {

    var cursor = document.createElement('i');
    cursor.className = getFullClassName('row-cursor');

    this.cursor = cursor;
    this.bodyPanel._contentPanel.appendChild(cursor);

    return cursor;

};
_prototype._createBodyContainer = function _createBodyContainer() {

    var cellsInstance = this.cellsInstance;
    var bodyContainer = this.bodyPanel = document.createElement('div');
    bodyContainer.className = getFullClassName('body-container');

    bodyContainer.setAttribute('scroll-x', String(cellsInstance.config.scrollX));
    bodyContainer.setAttribute('scroll-y', String(cellsInstance.config.scrollY))

    var rowContainer = this._createRowContainer();
    bodyContainer.appendChild(rowContainer);

    var freezeContainer = this._createFreezeContainer();
    bodyContainer.appendChild(freezeContainer);

    bodyContainer._contentPanel = rowContainer;
    return bodyContainer;
};
_prototype._createRowContainer = function _createRowContainer() {

    var rowContainer = document.createElement('div');
    rowContainer.className = getFullClassName('row-container');
    return rowContainer;

};
_prototype._createHeader = function _createHeader() {

    var headerContainer = document.createElement('header');
    headerContainer.className = getFullClassName('header');
    this.headerPanel = headerContainer;

    var headerContentPanel = document.createElement('div');
    headerContentPanel.className = getFullClassName(headerContentClassName);

    headerContainer.appendChild(headerContentPanel);

    var headerFreeContainer = this._createHeaderFreezeContainer();
    headerContainer.appendChild(headerFreeContainer);

    headerContainer._contentPanel = headerContentPanel;
    return headerContainer;

};
_prototype.syncCursor = function syncCursor() {

    var cursor = this.cursor;
    if (!cursor) {
        return;
    }
    var domCache = this.domCache;
    var rowsTop = domCache.rowsTop,
        rowsHeight = domCache.rowsHeight,
        colsLeft = domCache.colsLeft,
        colsWidth = domCache.colsWidth;
    var curTop = rowsTop[rowsTop.length - 1] + rowsHeight[rowsHeight.length - 1],
        curWidth = colsLeft[colsLeft.length - 1] + colsWidth[colsWidth.length - 1];

    style(cursor, {
        width: curWidth + 'px',
        top: curTop + 'px'
    });
    this.computeScrollbarState();
    var key = this._id + 'resizeScrollbar';
    executeFunctionDelay(key, this.resizeScrollbar, this);

};
_prototype.getGlobalMinWidth = function () {

    var cellsInstance = this.cellsInstance,
        config = cellsInstance.config;
    return parseInt(config.minCellWidth);

};
_prototype.getGlobalMinHeight = function () {

    var cellsInstance = this.cellsInstance,
        config = cellsInstance.config;
    return parseInt(config.minCellHeight);

};
_prototype.getMinCellWidth = function (col) {

    var cellsInstance = this.cellsInstance,
        cellsModel = cellsInstance.cellsModel;
    var field = cellsModel.header.fields[col];
    return field && field.minWidth || this.getGlobalMinWidth();

};
_prototype.getMinCellHeight = function (rowIndex) {

    var cellsInstance = this.cellsInstance,
        cellsModel = cellsInstance.cellsModel;
    if (rowIndex === -1) {
        return cellsModel.header.minHeight || this.getGlobalMinHeight();
    }
    var row = cellsModel.rows[rowIndex]
    return row && row.minHeight || this.getGlobalMinHeight();

};
_prototype._initCellSizeIndex = function () {

    this._initCellWidthIndex();
    this._initCellHeightIndex();

};
function isNum(v){
    return !isNaN(v) && typeof v === 'number';
}
_prototype._initHeaderFieldsWidth = function(){
    var cellsModel = this.cellsInstance.cellsModel;
    var fixedFields = [],autoFields = [];
    var panelSize = this.getPanelSize();
    var totalWidth = panelSize.width;
    cellsModel.header.fields.filter(function(field,index){
        var maxWidth = field.maxWidth,minWidth = this.getMinCellWidth(index);
        maxWidth = parseFloat(maxWidth),minWidth = parseFloat(minWidth);
        field.maxWidth = maxWidth;
        field.minWidth = minWidth;
        if(field.width){
            var width = this._parseCellWidth(field.width);
            if(maxWidth){
                width = Math.min(maxWidth,width);
            }
            if(minWidth){
                width = Math.max(minWidth,width,0);
            }
            field._width = width;
            fixedFields.push(field);
            totalWidth -= width;
        }else{
            if(isNum(maxWidth) && isNum(minWidth) && maxWidth === minWidth) {
                field._width = maxWidth
                fixedFields.push(field);
                totalWidth -= maxWidth;
            }else{
                autoFields.push(field);
            }
        }

    }.bind(this));

    var avgWidth = Math.round(totalWidth / (autoFields.length || 1));
    autoFields.forEach(function(field){
        var width = avgWidth;
        width = Math.min(width,totalWidth);
        field._width = width;
        totalWidth -= width;
    });
    var consumeWidth = function(width){
        var noConsumer = true;
        autoFields.forEach(function(field){
            var maxWidth = field.maxWidth;
            if(isNum(maxWidth) && field._width - maxWidth >= 0){
                return;
            }
            noConsumer = false;
            field._width += 1;
            width--;
        });
        if(!noConsumer && width > 0){
            consumeWidth(width);
        }
        return width;
    };
    var produceWidth = function(width){
        var noProducer = true;
        autoFields.forEach(function(field){
            var minWidth = field.minWidth;
            if(isNum(minWidth) && field._width - minWidth <= 0){
                return;
            }
            noProducer = false;
            field._width -= 1;
            width--;
        });
        if(!noProducer && width > 0){
            produceWidth(width);
        }
        return width;
    };
    autoFields.some(function(field){
        var minWidth = field.minWidth,maxWidth = field.maxWidth;
        var width = field._width;
        if(width < minWidth){
            produceWidth(minWidth - width);
            field._width = minWidth;
            return;
        }
        if(width > maxWidth){
            consumeWidth(width - maxWidth);
            field._width = maxWidth;
            return;
        }
    });
};
_prototype._initCellWidthIndex = function () {

    var cellsModel = this.cellsInstance.cellsModel,
        colsWidth = this.domCache.colsWidth,
        colsLeft = this.domCache.colsLeft;

    this._initHeaderFieldsWidth();

    var maxWidth = 0;
    cellsModel.header.fields.forEach(function (field, index) {
        var colWidth = field._width;
        colsWidth[index] = colWidth;
        maxWidth += colWidth;
        if (index === 0) {
            colsLeft[index] = 0;
        } else {
            colsLeft[index] = colsLeft[index - 1] + colsWidth[index - 1];
        }

    }.bind(this));

};
_prototype._initCellHeightIndex = function () {

    var domCache = this.domCache,
        cellsInstance = this.cellsInstance,
        cellsModel = cellsInstance.cellsModel;

    var headerHeight = this._parseCellHeight(cellsModel.header.height);
    headerHeight = Math.max(headerHeight, this.getMinCellHeight(-1));
    domCache.headerHeight = headerHeight;

    this._initBodyCellHeightIndex();

};
_prototype._initBodyCellHeightIndex = function (startIndex) {
    var domCache = this.domCache,
        cellsInstance = this.cellsInstance,
        cellsModel = cellsInstance.cellsModel;
    startIndex = startIndex || 0;
    var rows = cellsModel.rows;
    var rowsTop = domCache.rowsTop,
        rowsHeight = domCache.rowsHeight;

    //create page cursor
    rows.slice(startIndex).forEach(function (row, index) {
        index += startIndex;
        var rowHeight = this._parseCellHeight(row.height);
        rowHeight = Math.max(rowHeight, this.getMinCellHeight(index))
        rowsHeight[index] = rowHeight;
        if (index === 0) {
            rowsTop[index] = 0;
        } else {
            rowsTop[index] = rowsTop[index - 1] + rowsHeight[index - 1];
        }
    }.bind(this));
};
_prototype._parseCellWidth = function (width) {

    var panelSize = this.getPanelSize();
    var clientWidth = panelSize.width;
    if (typeof width === 'string' && width && width.indexOf('%') === width.length - 1) {
        width = Math.floor(parseFloat(width) / 100 * clientWidth);
    } else {
        width = parseInt(width);
    }
    return isNaN(width) ? 100 : width;

};
_prototype._parseCellHeight = function (height) {

    if (typeof height === 'string' && height && height.indexOf('%') === height.length - 1) {
        var clientHeight = this.getPanelSize().height;
        height = Math.floor(parseFloat(height) / 100 * clientHeight);
    } else {
        height = parseInt(height);
    }
    return height ? height : 30;

};
_prototype._onAppendRows = function () {

    var rowsHeight = this.domCache.rowsHeight;
    this._initBodyCellHeightIndex(rowsHeight.length);
    this.syncCursor();
    var key = this._id + 'repaintRequest';
    executeFunctionDelay(key, this.repaint, this);

};
_prototype._bindCellsModelEvent = function () {

    var cellsInstance = this.cellsInstance;
    cellsInstance.cellsModel.bind('refresh', function () {
        var key = this._id + 'refresh';
        if (cellsInstance.renderTo) {
            executeFunctionDelay(key, this.repaint, this);
        }
    }.bind(this));

    cellsInstance.cellsModel.bind('appendRows', function () {
        var key = this._id + 'appendRows';
        if (cellsInstance.renderTo) {
            executeFunctionDelay(key, this._onAppendRows, this);
        }
    }.bind(this));
};

_prototype.tiggerCellEvent = function tiggerCellEvent(cell,eventName,origin) {

    var cellsInstance = this.cellsInstance;
    var cellsModel = cellsInstance.cellsModel,
        cellsEvent = cellsInstance.cellsEvent,
        col = parseInt(cell.getAttribute('col'));
    if (cell._headerCell) {
        cellsEvent.triggerEvent(CellsEvent.createEvent(eventName, cell, cellsModel.header.fields[col],origin));
        return;
    }
    var row = parseInt(cell.getAttribute('row'));
    var rowData = cellsModel.rows[row];
    if (rowData) {
        cellsEvent.triggerEvent(CellsEvent.createEvent(eventName, cell, rowData.fields[col],origin));
    }
};
function _bindScrollEvent() {

    var cellsInstance = this.cellsInstance,
        cellsEvent = cellsInstance.cellsEvent;
    var headerPanel = this.headerPanel,
        scrollbar = this.scrollbar;
    var headerContentPanel = headerPanel._contentPanel;
    scrollbar.addEventListener('scroll', function (e) {

        var scrollLeft = scrollbar.scrollLeft;
        style(headerContentPanel, 'left', -scrollLeft + 'px');
        var key = this._id + 'repaintRequest';
        executeFunctionDelay(key, this.repaint, this);

        var event = CellsEvent.createEvent('scroll', scrollbar, cellsInstance.cellsModel,e);
        cellsEvent.triggerEvent(event);

    }.bind(this));
}
function getCellTarget(panel,target){
    if(target === panel){
        return null;
    }
    if (target._cell) {
        return target;
    } else {
        while (target = target.parentNode) {
            if (target === panel) {
                break;
            }
            if (target._cell) {
                return target;
            }
        }
    }
    return null;
}
function _bindClickEvent() {

    var cellsInstance = this.cellsInstance,
        cellsEvent = cellsInstance.cellsEvent;
    var _ = this, cellsPanel = this.cellsPanel;
    cellsPanel.addEventListener('click', function (e) {

        var target = e.target;
        if (target === cellsPanel) {
            cellsEvent.triggerEvent(CellsEvent.createEvent('click', cellsPanel, cellsInstance.cellsModel,e));
            return;
        }
        if (cellsEvent.existEventListener('cellClick')) {

            var cell = getCellTarget(cellsPanel,target);
            if(cell){
                _.tiggerCellEvent(cell,'cellClick',e);
            }
        }
        cellsEvent.triggerEvent(CellsEvent.createEvent('click', cellsPanel, cellsInstance.cellsModel,e));
    });

}
function _bindContextMenuEvent() {

    var cellsInstance = this.cellsInstance,
        cellsEvent = cellsInstance.cellsEvent;
    var _ = this, cellsPanel = this.cellsPanel;
    cellsPanel.addEventListener('contextmenu', function (e) {

        var target = e.target;
        if (target === cellsPanel) {
            cellsEvent.triggerEvent(CellsEvent.createEvent('contextMenu', cellsPanel, cellsInstance.cellsModel,e));
            return;
        }
        if (cellsEvent.existEventListener('cellContextMenu')) {

            var cell = getCellTarget(cellsPanel,target);
            if(cell){
                _.tiggerCellEvent(cell,'cellContextMenu',e);
            }
        }
        cellsEvent.triggerEvent(CellsEvent.createEvent('contextMenu', cellsPanel, cellsInstance.cellsModel,e));
    });

}
_prototype.bindEvent = function () {
    _bindScrollEvent.call(this);
    _bindClickEvent.call(this);
    _bindContextMenuEvent.call(this);
};
_prototype.render = function render() {

    initRender.apply(this);

    this._initPanelSize();
    this._initCellSizeIndex();
    this.headerHeight(this.domCache.headerHeight);
    this.executePaint();
    this.syncCursor();

    this.cellsInstance.triggerEvent(CellsEvent.createEvent('renderFinished', this));

};
_prototype.paint = function paint() {

    var domCache = this.domCache;
    this.initPaint();
    this._initPanelSize();
    this._initCellSizeIndex();
    this.headerHeight(domCache.headerHeight);
    this.executePaint();
    this.syncCursor();

};
_prototype.repaint = function repaint() {

    this.executePaint();

};
_prototype.headerHeight = function (height) {

    var domCache = this.domCache;

    if (!height) {
        return domCache.headerHeight;
    }
    height = parseInt(height);
    if (typeof height !== 'number') {
        return;
    }
    domCache.headerHeight = height;
    height = height + 'px';
    this.headerPanel.style.height = height;
    this.cellsPanel.style.paddingTop = height;
};
_prototype.scrollTo = function (scrollTop, scrollLeft) {

    var scrollbar = this.scrollbar;

    if (arguments.length === 0) {
        return {
            scrollLeft: scrollbar.scrollLeft,
            scrollTop: scrollbar.scrollTop
        };
    }
    scrollbar.scrollLeft = scrollLeft;
    scrollbar.scrollTop = scrollTop;

};
CellsRender.addInitHooks(function () {
    this._bindCellsModelEvent();
});
Cells.publishMethod(['render', 'paint', 'repaint', 'scrollTo', 'headerHeight'], 'cellsRender');
Cells.addInitHooks(function () {
    this.cellsRender = new CellsRender(this);
});
export { CellsRender }