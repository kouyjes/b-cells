# b-cells
B-cells is a component for rendering big data

## Demo
[Demo url](https://kouyjes.github.io/b-cells/examples/table.html)

## Get Starting
### Define CellsModel
1.Init CellsModel
```javascript
    var cellsModel = new HERE.UI.CELL.CellsModel();
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
        maxWidth:'',
        style:{
            backgroundColor:'' // define background color
        }
    };
    header.fields.push(field);
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
    var tableCell = new HERE.UI.CELL.Cells(cellsModel1,{
        renderTo:'#table1',// dom selector
        rowResize:true, // if row resizable
        colResize:true, // if column resizable
        scrollY:true, // if scroll Y
        scrollX:false, // if scroll X
        customScroll:null // use default scrollbar if null
        /*
         {
             width:12,height:13,hTrackColor:'',
             hScrollColor:'',
             vTrackColor:'',
             vScrollColor:'',
             autoHideX:true,
             autoHideY:true,
             timeout:1300
         }
         */
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
