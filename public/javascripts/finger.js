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
    if(mode === 'edit') {
	canvas.onmousedown = pushDown;
	canvas.onmouseup = liftOff;
	canvas.ontouchstart = pushDown;
	canvas.ontouchstop = liftOff;
	canvas.ontouchmove = updatePos;
    } else {
	canvas.onmousedown = null;
	canvas.onmouseup = null;
	canvas.ontouchstart = null;
	canvas.ontouchstop = null;
	canvas.ontouchmove = null;
    }
};

var Segment = function(p1,p2) {
    this.p1 = p1;
    this.p2 = p2;
};
Segment.prototype.constructor = Segment;

Segment.prototype.render = function(context) {
    context.beginPath();
    context.moveTo(this.p1.x, this.p1.y);
    context.lineTo(this.p2.x, this.p2.y);
    context.stroke();
    context.closePath();
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