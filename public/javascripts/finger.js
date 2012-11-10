var lastPoint = null;
var logText = "";

var trails = [];

var timer = null;
var SAMPLING_FREQUENCY = 100;

var DISTANCE_THRESHOLD = 20;

var Colors = {
  WHITE: "#FFFFFF",
  BLACK: "#000000",
  RED: "#FF0000",
  GREEN: "#00FF00",
  MARKER: "#0000FF"
};

var Scene = function(id, canvas) {
  // interface properties
  this.mode = ko.observable('edit');

  // state
  this.id = id;
  this.shapes = [];
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  this.currentShape = new Shape(this.context);
  this.trackedShape = null;
  this.reset();    
};
Scene.prototype.constructor = Scene;

Scene.prototype.reset = function() {
  for(var i=0; i<this.shapes.length; i++)
    this.shapes[i].reset();

  this.canvas.width = this.canvas.width;
  var oldFillStyle = this.context.fillStyle;
  if(this.mode() === "edit") {
    this.context.fillStyle  = Colors.WHITE;
    this.context.fillRect(0,0,this.canvas.width, this.canvas.height);
  }
  this.context.fillStyle = oldFillStyle;
  
  this.context.lineWidth = 2;
  this.context.strokeStyle = "rgb(0, 0, 0)";
};

Scene.prototype.nextShape = function() {
  this.shapes.push(this.currentShape);
  this.currentShape = new Shape(this.context);
};

Scene.prototype.render = function() {
  for(var i=0; i<this.shapes.length; i++)
    this.shapes[i].render(this.context);
};

Scene.prototype.setMode = function(mode) {
  this.mode(mode);
  this.reset();
  this.render();
  if(mode === 'edit') {
    canvas.onmousedown = pushDown;
    canvas.onmouseup = liftOff;
    canvas.ontouchstart = pushDown;
    canvas.ontouchstop = liftOff;
    canvas.ontouchmove = updatePos;
  } else {
    canvas.onmousedown = startTracking;
    canvas.onmouseup = stopTracking;
    canvas.ontouchstart = startTracking;
    canvas.ontouchstop = stopTracking;
  }
};

Scene.prototype.computeCloserSegment = function(point) {
  var distance = null;
  var segment = null;
  var shape = null;
  var computed = null;
  var color = Colors.BLACK;
  for(var i=0; i<this.shapes.length; i++) {
    computed = this.shapes[i].computeCloserSegment(point);
    if(distance === null || computed.distance < distance) {
      shape = this.shapes[i];
      segment = computed.segment;
      distance = computed.distance;
    }
  }

  if(segment !== null) {
    if(shape !== this.trackedShape) {
      if(this.trackedShape !== null){
        this.trackedShape.oldProjectedTime = null;
        this.trackedShape.reset();
      }
      shape.oldProjectedTime = null;
      shape.reset();
    }
    this.trackedShape = shape;
    this.trackedShape.markProjection(segment, point);
    if(distance <= DISTANCE_THRESHOLD) {
      shape.highlightSegment(segment, Colors.RED);
      if(shape.canPlaySound)
        shape.playSound();
    } else 
      shape.highlightSegment(segment, Colors.GREEN);
  }
};

var Segment = function(p1,p2, startTime, timeSpan, counter) {
  this.counter = counter;
  this.p1 = p1;
  this.p2 = p2;
  this.projected = null;
  this.startTime = startTime;
  this.span = timeSpan;
};
Segment.prototype.constructor = Segment;

Segment.prototype.render = function(context) {    
  context.beginPath();
  context.strokeStyle = this.color;
  context.moveTo(this.p1.x, this.p1.y);
  context.lineTo(this.p2.x, this.p2.y);
  context.stroke();
  context.closePath();
  if(this.projected != null) {
    context.beginPath();
    context.arc(this.projected.x, this.projected.y, 2, 0, 2 * Math.PI, false);
    context.strokeStyle = Colors.MARKER;
    context.fillStyle = Colors.MARKER;
    context.fill();
    context.stroke();
    context.closePath();
  }
};

Segment.prototype.reset = function() {
  this.color = Colors.BLACK;
  this.projected = null;
};

Segment.prototype.markProjection = function(point) {
  this.projected = this.projection(point);
};

Segment.prototype.projectedTime = function() {
  if(this.projected === null) {
    console.log("(!!) Trying to project a non tracked segment");
  } else {
    var dist = function(x1,y1,x2,y2) {
      var xs=0,ys=0;
      xs = x2 - x1;
      xs = xs * xs;

      ys = y2 - y1;
      ys = ys * ys;
      
      return Math.sqrt(xs + ys);
    };

    var modulus = dist(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
    var projectedDistance = dist(this.p1.x, this.p1.y, this.projected.x, this.projected.y);
    var coefficient = parseFloat(projectedDistance) / parseFloat(modulus);

    return this.startTime + coefficient * this.span;
  }
};

Segment.prototype.projection = function(point) {
  var x = point.x, y = point.y, x1 = this.p1.x;
  var y1 = this.p1.y, x2 = this.p2.x, y2 = this.p2.y;

  var x1y1 = [x2-x1, y2-y1];

  //console.log("DIRECTOR");
  //console.log(x1y1);

  var rect = [x1y1[1], -x1y1[0], ((x1y1[0]*y1)-(x1y1[1]*x1))];
  //console.log("RECT");
  //console.log(rect)

  var perp = [x1y1[1], -x1y1[0]];
  //console.log("PERP");
  //console.log(perp);

  var rectPerp = [perp[1], -perp[0], ((perp[0]*y)-(perp[1]*x))];
  //console.log("PERP RECT");
  //console.log(rectPerp);

  var rpyc = [-rectPerp[1]/rectPerp[0],  -rectPerp[2]/rectPerp[0]];
  
  var yf =  -(rect[2] + rect[0]*rpyc[1]) / (rect[0]*rpyc[0] + rect[1]);

  var xf = ((-rectPerp[1]*yf) - rectPerp[2])/ rectPerp[0];
  //console.log("y: "+yf);
  //console.log("x: "+xf);
  return {x:xf, y:yf};
}

Segment.prototype.distance = function(point) {
  var x = point.x, y = point.y, x1 = this.p1.x;
  var y1 = this.p1.y, x2 = this.p2.x, y2 = this.p2.y;

  var dist = function(x1,y1,x2,y2) {
    var xs=0,ys=0;
    xs = x2 - x1;
    xs = xs * xs;

    ys = y2 - y1;
    ys = ys * ys;

    return Math.sqrt(xs + ys);
  };

  var dx1 = x - x1;
  var dx2 = x - x2;
  var dy1 = y - y1;
  var dy2 = y - y2;

  if (dx1*dx2 < 0) { 
    if (dy1*dy2 < 0) {
      return Math.min(Math.min(Math.abs(dx1), Math.abs(dx2)),Math.min(Math.abs(dy1),Math.abs(dy2)));
    }
    return Math.min(Math.abs(dy1),Math.abs(dy2));
  }
  if (dy1*dy2 < 0) {
    return Math.min(Math.abs(dx1),Math.abs(dx2));
  }
  return Math.min(Math.min(dist(x,y,x1,y1),dist(x,y,x2,y2)),Math.min(dist(x,y,x1,y2),dist(x,y,x2,y1)));

};

var Shape = function(context) {
  this.segments = [];
  this.context = context;
  this.initialTime = null;
  this.clock = null;
  this.markedSegmentCounter = null;
  this.canPlaySound = false;
  this.oldProjectedTime = null;
};

Shape.prototype.constructor = Shape;

Shape.prototype.playSound = function() {
  if(this.canPlaySound) {
    // debugger;
    var projectedTime = this.segments[this.markedSegmentCounter].projectedTime();
    var reproductionTime = (this.oldProjectedTime === null ? (projectedTime - this.segments[this.markedSegmentCounter].startTime) : (projectedTime - this.oldProjectedTime));
    console.log("===> SHOULD REPRODUCE "+reproductionTime+" FROM "+this.oldProjectedTime);
    this.oldProjectedTime = projectedTime;
  } else {
    console.log("(!!) Trying to play invalid sound");
  }
};

Shape.prototype.addPoint = function(point, draw) {
  if(this.lastPoint === undefined) {
    this.initialTime = (new Date()).getTime();
    this.clock = this.initialTime;
    this.lastPoint = point;
  } else {
    var nextClock = (new Date()).getTime();
    var segment = new Segment(this.lastPoint, point, this.clock - this.initialTime, (nextClock-this.clock), this.segments.length);
    this.clock = nextClock;
    this.segments.push(segment);
    this.lastPoint = point;
    if(draw === true)
      segment.render(this.context);
  }
};

Shape.prototype.render = function(context) {
  for(var i=0; i<this.segments.length; i++)
    this.segments[i].render(context);
};

Shape.prototype.markProjection = function(segment, point) {
  segment.markProjection(point);
  // We only allow to play a sound if two consecutive segments are tracked
  // by the user.
  // The first segment tracked can also be played up to the projection.
  if(this.markedSegmentCounter === null || this.markedSegmentCounter === (segment.counter-1))
    this.canPlaySound = true;
  this.markedSegmentCounter = segment.counter;
  
}

Shape.prototype.computeCloserSegment = function(point) {
  var segment, distance, computed;
  for(var i=0; i<this.segments.length; i++) {
    computed = this.segments[i].distance(point);
    if(distance === undefined || computed < distance) {
      segment = this.segments[i];
      distance = computed;
    }
  }
  return {distance: distance, segment: segment};
};

Shape.prototype.highlightSegment = function(segment, color) {
  segment.color = color;
  //console.log("DISPLAYED SEGMENT WITH AT "+segment.startTime+" [ "+segment.span+" ] ");
};

Shape.prototype.reset = function() {
  this.markedSegmentCounter = null;
  this.canPlaySound = false;
  //this.oldProjectedTime = null;
  for(var i=0; i<this.segments.length; i++)
    this.segments[i].reset();
};


var divLog = function(text) {
  logText = logText + "\n"+text;
  jQuery("#log").text(logText);
};

//
// Handlers for mouse/touch events
//

function recordPath() {
  scene.currentShape.addPoint(lastPoint, true);
}

function computeEllapsedTime() {
  scene.reset();
  scene.computeCloserSegment(lastPoint);
  scene.render();
}

function pushDown(e) {
  //Wami.startRecording('/sound/capture/testfile');
  if (e.touches) {
    // Touch event
    for (var i = 1; i <= e.touches.length; i++) {
      point = getCoords(e.touches[i - 1]); // Get info for finger #1
    } 
  }
  else {
    // Mouse event
    lastPoint = getCoords(e);
    canvas.onmousemove = updatePos;
  }
  timer = setInterval(recordPath,SAMPLING_FREQUENCY);
  return false;
}


// Called whenever cursor position changes after drawing has started
function liftOff(e) {
  //Wami.stopRecording();
  scene.nextShape();
  e.preventDefault();
  canvas.onmousemove = null;
  clearInterval(timer);
}

function updatePos(e) {
  if (e.touches) {
    // Touch Enabled
    for (var i = 1; i <= e.touches.length; i++) {
      var p = getCoords(e.touches[e.touches.length - 1]); // Get info for finger i
      lastPoint = {x: p.x, y: p.y};
    }
  }
  else {
    // Not touch enabled
    var p = getCoords(e);
    lastPoint = {x: p.x, y: p.y};
  }
  return false;
}

function startTracking(e) {
  console.log("STARTING TRACKING");
  //Wami.startRecording('/sound/capture/testfile');
  if (e.touches) {
    // Touch event
    for (var i = 1; i <= e.touches.length; i++) {
      point = getCoords(e.touches[i - 1]); // Get info for finger #1
    }
    canvas.ontouchmove = updateTracking;  
  }
  else {
    // Mouse event
    lastPoint = getCoords(e);
    canvas.onmousemove = updateTracking;
  }
  timer = setInterval(computeEllapsedTime,SAMPLING_FREQUENCY);
  return false;
}


function updateTracking(e) {
  updatePos(e);
}

function stopTracking(e) {
  console.log("\n\n\nSTOP TRACKING");
  e.preventDefault();
  canvas.onmousemove = null;
  scene.reset();
  scene.render();
  clearInterval(timer);
}

// Get the coordinates for a mouse or touch event
function getCoords(e) {
  if (e.offsetX) {
    return { x: e.offsetX, y: e.offsetY };
  }
  else if (e.layerX) {
    return { x: e.layerX, y: e.layerY };
  }
  else {
    return { x: e.pageX - cb_canvas.offsetLeft, y: e.pageY - cb_canvas.offsetTop };
  }
}


//
// Main entry point
//

jQuery(document).ready(function() {
                         window.canvas = document.getElementById("canvas");
                         window.scene = new Scene(UUID,canvas);
                         window.scene.setMode('edit');

                         // Interface is live now
                         ko.applyBindings(scene);

                         //Wami.setup({ id : 'wami' });
                       });
