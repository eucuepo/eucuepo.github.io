(function($) {
 'use strict';
 $.visualBox = function(element, options) {
  this.options = {};

  element.data('visualBox', this);

  // widget constructor
  this.init = function(element, options) {         
    this.options = $.extend({}, $.visualBox.defaultOptions, options); 
        // init member vars
        canvasWidth = this.options.canvasWidth;
        canvasHeight = this.options.canvasHeight;
        boxes = [];
        currentSliderValue = 1;
        quadrantWidth = canvasWidth / 2;
        quadrantHeight = canvasHeight / 2;
        sliderValues = this.options.sliderValues;
        colors = this.options.colors;
        // init UI code
        initUI(element,options);

        // kinetic stage
        stage = new Kinetic.Stage({
          container: 'container',
          width: canvasWidth,
          height: canvasWidth
        });

        // init the coord system
        initCoordSystem();

        // init the tooltip
        initTooltip(stage);
      };

      this.init(element, options);
    };

    $.fn.visualBox = function(options) {                   
      return this.each(function() {
       (new $.visualBox($(this), options));              
     });        
    };

  // default options
  $.visualBox.defaultOptions = {
    canvasHeight: 500,
    canvasWidth: 500,
    sliderValues : null,
    colors: [
    'green',
    'blue',
    'red',
    'yellow'
    ]
  };

  //private
  var boxes;
  var currentSliderValue;
  var quadrantWidth;
  var quadrantHeight;
  var canvasWidth;
  var canvasHeight;
  var sliderValues;
  var stage;
  var colors;

  // Private functions
  // Initializes the UI, loading the html, generating the slider and the draggable names
  function initUI(element, options){
    var widgetHtml = '<div class="container"><div id="left" class="left"><ul id="sortable"></ul></div><div id="right" class="right"><div id="container"></div><div><div id="slider"></div></div></div></div>';
    element.html(widgetHtml);
    var sliderValuesLength;
    
    sliderValues = normalizeArray(sliderValues);

    // fill draggable list
    for (var value in sliderValues){
      if (sliderValues.hasOwnProperty(value)) {
         sliderValuesLength = sliderValues[value].length;
        $("#sortable").append('<li class="menubutton draggable ui-state-default">'+value+'</li>');
      }
    }
    // add the delete button
    $("#sortable").append('<li id="clear" class="clearbutton ui-state-highlight">Clear all</li>');
    $("#clear").click(function() {
      clearAll();
    });
    // init slider
    $("#slider").slider({
      value:1,
      min: 1,
      max: sliderValuesLength,
      step: 1,
      slide: function( event, ui ) {
        currentSliderValue = ui.value;
        reDrawBoxes(ui.value);
      }
    });
    // set slider width equal to the canvas width
    $("#slider").css("width",canvasWidth);

    // init draggable components
    $( ".draggable" ).draggable({
      connectToSortable: "#sortable",
      helper: "clone",
      revert: false,
      stop: function( event, ui ) {
        var quadrant = getQuadrant(ui.position.left,ui.position.top,quadrantHeight,quadrantWidth,canvasHeight,canvasWidth);
        if(quadrant !== -1){
          var label = ui.helper.html();
          //we got the quadrant, draw rect
          drawRect(quadrant,label);
        }
      }
    });
  }

  // deletes a box from the layer
  function deleteRect(quadrant){
    boxes[quadrant].shape.remove();
    boxes[quadrant].button.remove();
    delete boxes[quadrant];
    stage.get("#rectLayer")[0].draw();
  }

  // clear all boxes from the layer
  function clearAll(){
    for (var i = boxes.length - 1; i >= 0; i--) {
      if(boxes[i]!=null){
        deleteRect(i);
      }
    };
    // remove any other shapes if any
    stage.get("#rectLayer")[0].removeChildren();
  }

  // initializes the coord system
  function initCoordSystem(){
    // draw quadrant
    // dashed line
    var horizontalLine = new Kinetic.Line({
      points: [0, canvasWidth/2, canvasHeight, canvasWidth/2],
      stroke: 'black',
      strokeWidth: 1,
      lineJoin: 'round',
      dashArray: [5, 10]
    });

    var verticalLine = new Kinetic.Line({
      points: [canvasHeight/2, 0, canvasHeight/2, canvasWidth],
      stroke: 'black',
      strokeWidth: 1,
      lineJoin: 'round',
      dashArray: [5, 10]
    });

    var gridLayer = new Kinetic.Layer({
      id: 'gridLayer'
    });
    gridLayer.add(horizontalLine);
    gridLayer.add(verticalLine);

    stage.add(gridLayer);

    //add box layer
    var rectLayer = new Kinetic.Layer({
      id: 'rectLayer'
    });
    // add the layer to the stage
    stage.add(rectLayer);
  }

  // initializes the tooltip
  function initTooltip(){
    //define the tooltip
    var tooltipText = new Kinetic.Text({
      text: '',
      fontFamily: 'Arial',
      fontSize: 16,
      padding: 10,
      fill: 'white',
      id: 'tooltipText'
    });

    var tooltipRect = new Kinetic.Rect({
      width: tooltipText.getWidth(),
      height: tooltipText.getHeight(),
      fill: 'black',
      opacity: 0.6,
      id: 'tooltipRect'
    });

    var tooltipGroup = new Kinetic.Group({
      visible: false,
      id: 'tooltipGroup'
    });
    //add the tooltip layer
    var tooltipLayer = new Kinetic.Layer({
      id: 'tooltipLayer'
    });

    tooltipGroup.add(tooltipRect);
    tooltipGroup.add(tooltipText);
    tooltipLayer.add(tooltipGroup);
    stage.add(tooltipLayer);
    tooltipLayer.moveToTop();
  }

  // retrieve the color depending on the quadrant
  function getColor(quadrant){
    return colors[quadrant];
  }

  // get the quadrant corresponding to the mouse position on drag event
  function getQuadrant(left,top){
    var leftOffset = $("#left").css("width");
    //trim 'px'
    leftOffset = leftOffset.substring(0, leftOffset.length - 2);
    var rightOffset = $("#right").css("margin-top");
    //trim 'px'
    rightOffset = rightOffset.substring(0, rightOffset.length - 2);
    var xCoord = left - leftOffset;
    var yCoord = top - rightOffset;
    if(xCoord < quadrantWidth && xCoord > 0 && yCoord < quadrantHeight && yCoord > 0){
      return 0;
    } else if(xCoord > quadrantWidth && xCoord < canvasWidth && yCoord < quadrantHeight && yCoord > 0){
      return 1;
    } else if(xCoord < quadrantWidth && xCoord > 0 && yCoord > quadrantHeight && yCoord < canvasHeight){
      return 2;
    } else if(xCoord > quadrantWidth && xCoord < canvasWidth && yCoord > quadrantHeight && yCoord < canvasHeight){
      return 3;
    } else {
      return -1;
    }
  }

  // redraws the boxes according to the current value of the slider
  function reDrawBoxes(){
    //check how many boxes we have
    for (var i = 0; i < boxes.length; i++) {
      if(boxes[i] != null){
        var rectToChange;
        if(boxNumber() < 3){
          rectToChange = getRectangle(boxes[i].values,currentSliderValue-1,'green',i,true);
        }else{
          rectToChange = getRectangle(boxes[i].values,currentSliderValue-1,'green',i,false);
        }
        boxes[i].shape.transitionTo({
          width : rectToChange.attrs.width,
          height : rectToChange.attrs.height,
          x: rectToChange.attrs.x,
          y: rectToChange.attrs.y,
          duration : 0.2
        });
      } 
    }
  }

  // returns the current box number 
  function boxNumber(){
    var size = 0;
    for (var box in boxes) {
        if (boxes.hasOwnProperty(box)) size++;
    }
    return size;
  }


  // generates a Kinetic.Rectangle according to the parameters
  function getRectangle(box,index,color,quadrantNumber,stretch){
    /*
    For example: if the the 50th index of a dimension with 200 values is 0.60, 
    then the box should fill 50/200 = 0.25 of its height in the quadrant and 0.60 of 
    its width in the quadrant.
    */
    // stretch will be true when there are only two boxes, so they are stretched along al the height
    if(!stretch){
      var rectHeight = ((index+1)/box.length) * quadrantHeight;
      var rectWidth = (box[index]) * quadrantWidth;
      var padding = 5;
      var calculatedX;
      var calculatedY;

      if(quadrantNumber == 0){
        calculatedX = quadrantWidth-rectWidth - padding;
        calculatedY = quadrantWidth-rectHeight - padding;
      }else if(quadrantNumber == 1 ){
        calculatedX = quadrantWidth + padding;
        calculatedY = quadrantWidth - rectHeight - padding;
      }else if(quadrantNumber == 2 ){
        calculatedX = quadrantWidth - rectWidth - padding;
        calculatedY = quadrantWidth + padding;
      } else if(quadrantNumber == 3 ){
        calculatedX = quadrantWidth + padding;
        calculatedY = quadrantWidth + padding;
      }
    }else{
      var rectHeight = ((index+1)/box.length) * quadrantHeight * 2;
      var rectWidth = (box[index]) * quadrantWidth;
      var padding = 5;
      var calculatedX;
      var calculatedY;

      if(quadrantNumber == 0 || quadrantNumber == 2){
        calculatedX = quadrantWidth - rectWidth - padding;
        calculatedY = canvasHeight - rectHeight - padding;
      }else if(quadrantNumber == 1 || quadrantNumber == 3 ){
        calculatedX = quadrantWidth + padding;
        calculatedY =  canvasHeight -rectHeight - padding;
      }
    }

    //if the width is 0, then we pad a bit to show the tooltip
    if(rectWidth == 0){
      rectWidth = 5;
    }

    //generate the box
    var rect = new Kinetic.Rect({
      x: calculatedX,
      y: calculatedY,
      width: rectWidth,
      height: rectHeight,
      fill: color,
      stroke: 'black',
      strokeWidth: 1
    });

    return rect;
  }

  //draws a rectangle with the data label
  function drawRect(quadrant,label){

    if(boxes[quadrant] != null){
      boxes[quadrant].shape.remove();
    }
    var rect;
    if(boxNumber() < 3){
      rect = getRectangle(sliderValues[label],currentSliderValue -1,getColor(quadrant),quadrant,true);
    }else{
      rect = getRectangle(sliderValues[label],currentSliderValue -1,getColor(quadrant),quadrant,false);
    }

    rect.arrayValues = sliderValues[label];

    //get delete button
    var deleteButton = getDeleteButton(quadrant);

    rect.label = label;
    var boxToInsert = {
      shape: rect,
      values: sliderValues[label],
      button: deleteButton
    };
    boxes[quadrant] = boxToInsert;
    //position the tooltip up if two rects in lower quadrants
    var fixTooltipY = 0;
    if(boxNumber() < 3){
      fixTooltipY = 100;
    }

    //show tooltip
    rect.on("mousemove", function() {
      var mousePos = stage.getMousePosition();
      var tooltipGroup = stage.get("#tooltipGroup")[0];
      tooltipGroup.setPosition(mousePos.x + 5, mousePos.y + 5 - fixTooltipY);
      tooltipGroup.get('#tooltipText')[0].setText("Label: "+rect.label+"\nHeight: "+Math.floor(rect.getHeight())+"\nWidth: "+Math.floor(rect.getWidth())+"\nArea: "+Math.floor(rect.getHeight() * rect.getWidth()));
      tooltipGroup.get('#tooltipRect')[0].setWidth(tooltipGroup.children[1].getWidth());
      tooltipGroup.get('#tooltipRect')[0].setHeight(tooltipGroup.children[1].getHeight());
      tooltipGroup.show();
      stage.get("#tooltipLayer")[0].moveToTop();
      stage.get("#tooltipLayer")[0].draw();
    });

    //hide tooltip
    rect.on("mouseout", function() {
      var tooltipGroup = stage.get("#tooltipGroup")[0];
      tooltipGroup.hide();
      stage.get("#tooltipLayer")[0].draw();
    });
    
    stage.get("#rectLayer")[0].add(rect);
    stage.get("#rectLayer")[0].draw();
    stage.get("#rectLayer")[0].add(deleteButton);
    reDrawBoxes();
  }

  function getDeleteButton(quadrant){

    var deleteText = new Kinetic.Text({
      text: 'X',
      fontFamily: 'Arial',
      fontSize: 16,
      padding: 10,
      fill: 'white'
    });

    var deleteCircle = new Kinetic.Circle({
        x: deleteText.getWidth()/2,
        y: deleteText.getHeight()/2,
        radius: 11,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 2
      });

    var delX, delY;
    if(quadrant == 0){
      delX = 10;
      delY = 10;
    } else if(quadrant == 1) {
      delX = canvasWidth - 30;
      delY = 10;
    } else if (quadrant == 2) {
      delX = 10;
      delY = canvasHeight - 30;
    } else if (quadrant == 3) {
      delX = canvasWidth - 30;
      delY = canvasHeight - 30;
    }

    var tooltipGroup = new Kinetic.Group({
      x:delX,
      y:delY
    });

    // set the cursor to hand
    tooltipGroup.on('mouseover', function(){
    document.body.style.cursor = 'pointer';

    });
    // ...and switch back on
    tooltipGroup.on('mouseout', function(){
      document.body.style.cursor = 'default';
    });
    // delete on button click
    tooltipGroup.on('click', function(){
      tooltipGroup.remove();
      deleteRect(quadrant);
    });
    tooltipGroup.add(deleteCircle);
    tooltipGroup.add(deleteText);
    return tooltipGroup;
  }

  // normalizes a set of arrays to the same length. The length is equal to the biggest element
  function normalizeArray(a){
    //get the biggest length
    var maxLength = 0;
    var arrayToReturn = [];
    for (var value in sliderValues){
      if (sliderValues.hasOwnProperty(value)) {
        if(sliderValues[value].length > maxLength)
         maxLength = sliderValues[value].length;
      }
    }
    //normalize array with linear interpolation
    for (var value in sliderValues){
      if (sliderValues.hasOwnProperty(value)) {
        arrayToReturn[value] = interpolateArray(sliderValues[value],maxLength);
      }
    }
    return arrayToReturn;
  }

  // linear interpolate array a[] -> array b[]
  function interpolateArray( a, newSize ){
    var b = [];
    var oldSize = a.length;
    var step = ( oldSize - 1 ) / (newSize - 1);
    for( var j = 0; j < newSize; j ++ ){
      var jstep = j*step;
      b[j] = interpolate(jstep , a, oldSize );
    }
    return b;
  }
  // linear interpolate array position
  function interpolate( x, a, n ){
    if( x <= 0 ) return a[0];
    if( x >= n - 1 ) return a[n-1];
    var j = Math.floor(x);
    return a[j] + (x - j) * (a[j+1] - a[j]);
  }

})(jQuery);