var lastPoint = null;
var cb_easing = 0.4;
var logText = "";

var trails = [];

var timer = null;
var sampleFrequency = 100;


var Scene = function(canvas) {
    // interface properties
    this.mode = ko.observable('edit');

    // state
    this.shapes = [];
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.currentShape = new Shape(this.context);
    this.reset();    
};
Scene.prototype.constructor = Scene;

Scene.prototype.reset = function() {
    for(var i=0; i<this.shapes.length; i++)
	this.shapes[i].reset();

    this.canvas.width = this.canvas.width;
    this.context.lineWidth = 2;
    this.context.strokeStyle = "rgb(0, 0, 0)";
};

Scene.prototype.nextShape = function() {
    this.shapes.push(this.currentShape);
    this.currentShape = new Shape(this.context);
};

Scene.prototype.render = function() {
    for(var i=0; i<this.shapes.length; i++)
	this.shapes[i].render(this.context)
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
    var color = "#000000";
    for(var i=0; i<this.shapes.length; i++) {
	computed = this.shapes[i].computeCloserSegment(point);
	if(distance === null || computed.distance < distance) {
	    shape = this.shapes[i];
	    segment = computed.segment;
	    distance = computed.distance;
	}
    }

    shape.highlightSegment(segment);
};

var Segment = function(p1,p2) {
    this.p1 = p1;
    this.p2 = p2;
};
Segment.prototype.constructor = Segment;

Segment.prototype.render = function(context) {
    context.beginPath();
    context.strokeStyle = this.color;
    context.moveTo(this.p1.x, this.p1.y);
    context.lineTo(this.p2.x, this.p2.y);
    context.stroke();
    context.closePath();
};

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

    if (dx1*dx2 < 0) { // x is between x1 and x2
	if (dy1*dy2 < 0) { // (x,y) is inside the rectangle
	    return Math.min(Math.min(Math.abs(dx1), Math.abs(dx2)),Math.min(Math.abs(dy1),Math.abs(dy2)));
	}
	return Math.min(Math.abs(dy1),Math.abs(dy2));
    }
    if (dy1*dy2 < 0) { // y is between y1 and y2
	// we don't have to test for being inside the rectangle, it's already tested.
	return Math.min(Math.abs(dx1),Math.abs(dx2));
    }
    return Math.min(Math.min(dist(x,y,x1,y1),dist(x,y,x2,y2)),Math.min(dist(x,y,x1,y2),dist(x,y,x2,y1)));

};

var Shape = function(context) {
    this.segments = [];
    this.context = context;
};

Shape.prototype.constructor = Shape;

Shape.prototype.addPoint = function(point, draw) {
    if(this.lastPoint === undefined)
	this.lastPoint = point;
    else {
	var segment = new Segment(this.lastPoint, point);
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

Shape.prototype.highlightSegment = function(segment) {
    segment.color = "#FF0000";
};

Shape.prototype.reset = function() {
    for(var i=0; i<this.segments.length; i++)
	this.segments[i].color = "#000000";
};


var divLog = function(text) {
    logText = logText + "\n"+text;
    jQuery("#log").text(logText);
};

// Setup event handlers
$(document).ready(function() {
    window.canvas = document.getElementById("canvas");
    window.scene = new Scene(canvas);
    window.scene.setMode('edit');

    // Interface is live now
    ko.applyBindings(scene);

    //Wami.setup({ id : 'wami' });
});

function recordPath() {
    scene.currentShape.addPoint(lastPoint, true);
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
    timer = setInterval(recordPath,sampleFrequency);
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
    timer = setInterval(function(){
	scene.reset();
	scene.computeCloserSegment(lastPoint);
	scene.render();
    },sampleFrequency);
    return false;
}


function updateTracking(e) {
    updatePos(e);
    console.log("UPDATING TRACKING FOR "+lastPoint.x+","+lastPoint.y);
    scene.computeCloserSegment(lastPoint);
}

function stopTracking(e) {
    console.log("\n\n\nSTOP TRACKING");
    e.preventDefault();
    canvas.onmousemove = null;
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