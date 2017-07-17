# b-cells
B-cells is a component for rendering big data

## Demo
[Demo url](http://htmlpreview.github.io/?https://github.com/kouyjes/b-cells/blob/master/examples/table.html)

## Get Starting
### Define CellsModel
1.Init CellsModel
```javascript
    var cellsModel = new CELL.CellsModel();
```
2.Init Header
```javascript
    var header = {
        height:50, // define header height
        minHeight:100,// define min height of header
        fields:[]
    };
    // Define header field
    var field = {
        name:'', // define column header name
        width:'', // define width absolute width,or relative width,eg 200px or 20%
        minWidth:'',// define min width of column
        style:{
            backgroundColor:'' // define background color
        }
    };
    header.header.push(field);
```
2.Init Rows
```javascript
    var rows = [];
    // Define row
    var row = {
        height:'10%',// define row height 
        minHeight:'100px'
    };
    // define row fields
    var fields = [];
    fields.push({
        value:'row text',
        html:'',// define html value
        style:{
            'background-color':'#ccc'
        }
    });
    row.fields = fields;
    rows.push(row);
```
3.Append header and rows to cellsModel
```javascript
    cellsModel.header = header;
    cellsModel.rows = rows;
```
4.Init Cells
```javascript
    var tableCell = new CELL.Cells(cellsModel1,{
        renderTo:'#table1',// dom selector
        rowResize:true, // if row resizable
        colResize:true, // if column resizable
        overflowY:false, // if overflow Y
        overflowX:false, // if overflow X
        enableCustomScroll:false // if use custom scrollbar
    });
```
5.Render cells
```javascript
    tableCell.render();
```
6.Cells Event
- Click Event (triggered when click cells area)
```javascript
    tableCell.addEventListener('click', function (e) {
    })
```
- Cells click Event (triggered when click a cell)
```javascript
    tableCell.addEventListener('cellClick', function (e) {
    });
```
- Scroll event (triggered when scrolling)
```javascript
    tableCell.addEventListener('scroll', function (e) {
    });
```
