var lastPoint = null;
var logText = "";

var trails = [];

var timer = null;
var sampleFrequency = 100;

var DISTANCE_THRESHOLD = 20;

var Colors = {
    BLACK: "#000000",
    RED: "#FF0000",
    GREEN: "#00FF00",
    MARKER: "#0000FF"
};

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

    if(segment !== null) {
	segment.markProjection(point);
	if(distance <= DISTANCE_THRESHOLD)
	    shape.highlightSegment(segment, Colors.RED);
	else
	    shape.highlightSegment(segment, Colors.GREEN);
    }
};

var Segment = function(p1,p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.projected = null;
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

var s = new Segment({x:2,y:-3},{x:-5,y:1});
s.projection({x:-8,y:12});

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

Shape.prototype.highlightSegment = function(segment, color) {
    segment.color = color;
};

Shape.prototype.reset = function() {
    for(var i=0; i<this.segments.length; i++)
	this.segments[i].reset();
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
    timer = setInterval(computeEllapsedTime,sampleFrequency);
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