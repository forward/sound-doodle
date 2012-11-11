var lastPoint = null;
var logText = "";

var trails = [];

var timer = null;

// turns on debug rendering of segments
var DEBUG = false;

var SAMPLING_FREQUENCY = 200;
var PLAYBACK_FREQUENCY = 200;
var DISTANCE_THRESHOLD = 30;

var Colors = {
    WHITE: "#FFFFFF",
    BLACK: "#000000",
    RED: "#FF0000",
    GREEN: "#00FF00",
    MARKER: "#0000FF"
};

Colors.random = function() {
    var r = parseInt((Math.random() * 1000) % 255);
    var g = parseInt((Math.random() * 1000) % 255);
    var b = parseInt((Math.random() * 1000) % 255);
    return 'rgba('+r+', '+g+', '+b+', 0.5)'
};


window.Sound = {
    init: function() {
        Sound.audiolet = (new Audiolet());
    },
    play: function(file, startTime, timeSpan, totalTime) {
        if(timeSpan > 0) {
            var soundBuffer = new AudioletBuffer(1, 0);
            
            soundBuffer.load(file, false);
            var bufferLength = soundBuffer.length;

            var startByte = startTime / totalTime * bufferLength;
            //console.log(bufferLength);
            //console.log(startByte);
            //console.log(timeSpan);
            //console.log(totalTime);

            // var endByte = timeSpan / totalTime * bufferLength;
            
            var rate = 0.5;
            var inc = timeSpan/PLAYBACK_FREQUENCY
            if(inc < 1) {
                rate = 0.5 + (inc * 0.05);
            } else {
                rate = 0.55 + ((inc - 1) * 0.05);
            }

            //console.log("===> SHOULD REPRODUCE "+timeSpan+" FROM "+startTime+" RATE "+rate);
            

            var player = new BufferPlayer(Sound.audiolet, soundBuffer, rate, 0, 0);
            var restartTrigger = new TriggerControl(Sound.audiolet);
            restartTrigger.connect(player, 0, 1);
            player.connect(Sound.audiolet.output);
            player.startPosition.setValue(startByte);


            restartTrigger.trigger.setValue(1);
            setTimeout(function(){
                console.log("doing shit");
                player.disconnect(Sound.audiolet.output);

            },timeSpan);
        }
    }
};


window.Scene = function(id, canvas) {
    // interface properties    
    this.mode = ko.observable('edit');
    this.tool = ko.observable('record');
    
    this.stored = ko.observable(false);
    this.playUrl = ko.observable("/play/"+id);

    this.note_c1 = ko.observable(false);	
    this.note_c2 = ko.observable(true);	
    this.note_c3 = ko.observable(false);	
    this.note_c4 = ko.observable(false);	
    this.note_c5 = ko.observable(false);	

    this.note_d1 = ko.observable(true);	
    this.note_d2 = ko.observable(false);	
    this.note_d3 = ko.observable(false);	
    this.note_d4 = ko.observable(false);	
    this.note_d5 = ko.observable(false);	

    this.note_e1 = ko.observable(false);	
    this.note_e2 = ko.observable(false);	
    this.note_e3 = ko.observable(false);	
    this.note_e4 = ko.observable(false);	
    this.note_e5 = ko.observable(false);	

    this.note_f1 = ko.observable(false);	
    this.note_f2 = ko.observable(false);	
    this.note_f3 = ko.observable(true);	
    this.note_f4 = ko.observable(false);	
    this.note_f5 = ko.observable(false);	

    this.note_g1 = ko.observable(false);	
    this.note_g2 = ko.observable(false);	
    this.note_g3 = ko.observable(false);	
    this.note_g4 = ko.observable(false);	
    this.note_g5 = ko.observable(false);	

    this.note_a1 = ko.observable(false);
    this.note_a2 = ko.observable(false);	
    this.note_a3 = ko.observable(false);	
    this.note_a4 = ko.observable(false);	
    this.note_a5 = ko.observable(true);	

    this.note_b1 = ko.observable(false);	
    this.note_b2 = ko.observable(false);	
    this.note_b3 = ko.observable(false);	
    this.note_b4 = ko.observable(true);	
    this.note_b5 = ko.observable(false);	


    // state
    this.id = id;
    this.shapes = [];
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    console.log(this.id, id);
    this.currentShape = new Shape(this.context, this.shapes.length, this.id);
    this.trackedShape = null;
    this.reset();    
};
Scene.prototype.constructor = Scene;

Scene.load = function(id,canvas, cb) {
    var path = "/scenes/"+id;
    var that = this;
    jQuery.ajax({type:"GET",
		 url: path}).done(function(json) {
		     if(typeof(json) === 'string') {
			 cb(Scene.fromJSON(canvas,JSON.parse(json)));
		     } else {
			 cb(Scene.fromJSON(canvas,json));
		     }
		 });
};

Scene.fromJSON = function(canvas,json) {
    var scene = new Scene(json.id,canvas);
    scene.stored(true);
    var notes = ['c','d','e','f','g','a','b'];
    var maxBeats = 6;
    for(var i=1; i<maxBeats; i++)
	for(var j=0; j<notes.length; j++)
	    scene["note_"+notes[j]+i](json["note_"+notes[j]+i]);
    for(i=0; i<json.shapes.length; i++)
	scene.shapes.push(Shape.fromJSON(json.shapes[i], scene.context, json.id));

    return scene;
};

Scene.prototype.toJSON = function() {
    var acum = {};
    var notes = ['c','d','e','f','g','a','b'];
    var maxBeats = 6;
    for(var i=1; i<maxBeats; i++)
	for(var j=0; j<notes.length; j++)
	    acum["note_"+notes[j]+i] = this["note_"+notes[j]+i]();
    
    acum.id = this.id;
    acum.shapes = this.shapes.map(function(shape) {
	return shape.toJSON();
    });

    return acum;
};

Scene.prototype.reset = function() {
    for(var i=0; i<this.shapes.length; i++)
        this.shapes[i].reset();

    this.canvas.width = this.canvas.width;
    var oldFillStyle = this.context.fillStyle;

    this.context.fillStyle  = Colors.WHITE;
    this.context.fillRect(0,0,this.canvas.width, this.canvas.height);


    this.context.fillStyle = oldFillStyle;
    
    this.context.lineWidth = 2;
    this.context.strokeStyle = "rgb(0, 0, 0)";
};

Scene.prototype.nextShape = function() {
    if(this.currentShape.segments.length > 0)
	this.shapes.push(this.currentShape);

    console.log("TOOL "+this.tool());
    if(this.tool() === 'record') {
	this.currentShape = new Shape(this.context, this.shapes.length, this.id);
    } else if(this.tool() === 'synth') {
	this.currentShape = new SynthShape(this.context, this.shapes.length, this.id, this.parseNotes());
    } else {
	alert("Unknown tool "+this.tool());
    }
};

Scene.prototype.render = function() {
    for(var i=0; i<this.shapes.length; i++)
        this.shapes[i].render(this.context);
};

Scene.prototype.parseNotes = function() {
    var notes = [];
    var noteNames = ["c","d","e","f","g","a","b"];
    for(var beat = 1; beat<6; beat++) {
	var noteForBeat = [];
	for(var i=0; i<noteNames.length;i ++) {
	    var noteName = "note_"+noteNames[i]+beat;
	    if(this[noteName]() === true) {
		noteForBeat.push(noteNames[i]+"") ;
	    }
	}

	if(noteForBeat.length === 0) {
	    notes.push("R5");
	} else {
	    notes.push(noteForBeat.join(":")+"5");
	}
    }

    return notes.join(" ").toUpperCase();
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


Scene.prototype.setTool = function(mode) {
    this.tool(mode);
    this.reset();
    this.render();
    this.nextShape();
};

Scene.prototype.swapNote = function(note) {
    console.log("turning note "+note);
    var value = this['note_'+note]();
    this['note_'+note](!value);
    this.currentShape.notes = this.parseNotes();
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
        } else {
	    shape.notifyOutThreshold();
	    shape.highlightSegment(segment, Colors.GREEN);
	}
    }
};

Scene.prototype.getScreenshot = function() {
  this.forceColor();
  this.render();
  var data = this.canvas.toDataURL();
  this.reset();
  this.render();

  return data;
}

Scene.prototype.store = function() {
  var path = "/scenes/"+this.id;
  var that = this;
  jQuery.ajax({type:"POST",
		           data: JSON.stringify(this.toJSON()),
		           contentType:'application/json',
		           url: path}).done(function() {
		                              that.stored(true);
                                  
		                            });

  var screenPath = path + "/screenshot";
  var screenData = this.getScreenshot();
  
  jQuery.ajax({type:"POST",
		           data: screenData,
		           contentType:'image/png',
		           url: screenPath});
};

Scene.prototype.forceColor = function() {
  if(arguments.length === 0) {
    this.color = Colors.random();
    for(var i=0; i<this.shapes.length; i++) {
      this.shapes[i].forceColor();
    }
  } else {
    this.color = arguments[0];
    for(var i=0; i<this.shapes.length; i++) {
      this.shapes[i].forceColor();
    }
  }
};

var Segment = function(p1,p2, startTime, timeSpan, counter, shape) {
    this.counter = counter;
    this.p1 = p1;
    this.p2 = p2;
    this.projected = null;
    this.startTime = startTime;
    this.span = timeSpan;
    this.shape = shape;
};
Segment.prototype.constructor = Segment;

Segment.fromJSON = function(json, shape) {
    return new Segment(json.p1, json.p2, json.startTime, json.timeSpan, json.counter, shape);
};

Segment.prototype.toJSON = function() {
    var acum = {};
    acum.counter = this.counter;
    acum.p1 = this.p1;
    acum.p2 = this.p2;
    acum.startTime = this.startTime;
    acum.span = this.span;

    return acum;
};

Segment.prototype.forceColor = function() {
  if(arguments.length === 0) {
    this.color = Colors.random();
  } else {
    this.color = arguments[0];
  }
};

Segment.prototype.render = function(context) {    
    if(DEBUG===true)
	this.debugRender(context);
    else {
	context.beginPath();
	context.strokeStyle = this.color;
	context.fillStyle = this.color;
	var drawThreshold = DISTANCE_THRESHOLD - 10;
	if(this.shape.constructor === SynthShape) {
	    context.moveTo(this.p1.x, this.p1.y-drawThreshold);
	    context.lineTo(this.p1.x, this.p1.y+drawThreshold);
	    context.lineTo(this.p2.x, this.p2.y+drawThreshold);
	    context.lineTo(this.p2.x, this.p2.y-drawThreshold);
	    context.lineTo(this.p1.x, this.p1.y-drawThreshold);
	    context.fill();	
	} else {
	    context.moveTo(this.p1.x, this.p1.y);
	    context.lineTo(this.p2.x, this.p2.y);
	}

	context.stroke();
	context.closePath();
	
    }
};

Segment.prototype.debugRender = function(context) {    
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
    if(scene.mode() === 'play') {
	if(scene.trackedShape && scene.trackedShape === this.shape || this.color === Colors.BLACK || this.color == null) {
	    if(this.shape.constructor === SynthShape || (this.counter === 0)) {
		this.color = Colors.random();
	    } else {
		this.color = this.shape.segments[0].color;
	    }
	}
    } else {
	this.color = Colors.BLACK;
    }
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
    return null;
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

var Shape = function(context, id, scene_id) {
    if(arguments.length !== 0) {
	this.sceneId = scene_id;
	this.id = id;
	this.segments = [];
	this.context = context;
	this.initialTime = null;
	this.clock = null;
	this.markedSegmentCounter = null;
	this.canPlaySound = false;
	this.oldProjectedTime = null;
    }
};

Shape.prototype.constructor = Shape;

Shape.prototype.forceColor = function() {
  if(arguments.length === 0) {
    for(var i=0; i<this.segments.length; i++) {
      this.segments[i].forceColor();
    }  
  } else {
    for(var i=0; i<this.segments.length; i++) {
      this.segments[i].forceColor(arguments[0]);
    }  
  }
};

Shape.fromJSON = function(json, context, id, scene_id) {
    var shape = null;
    if(json.type === "shape") {
	shape = new Shape(context, id, scene_id);	 
    } else {
	shape = new SynthShape(context, id, scene_id, json.notes);	 	
    }
    shape.clock = json.clock;
    shape.initialTime = json.initialTime;
    shape.markedSegmentCounter = json.markedSegmentCounter;
    for(var i=0; i<json.segments.length; i++)
	shape.segments.push(Segment.fromJSON(json.segments[i], shape));
    return shape;
};

Shape.prototype.toJSON = function() {
    var acum = {};
    acum.sceneId = this.sceneId;
    acum.id = this.id;
    // context is missing and must be initialised here
    acum.clock = this.clock;
    acum.initialTime = this.initialTime;
    acum.markedSegmentCounter = this.markedSegmentCounter;
    acum.segments = this.segments.map(function(s) {
	return s.toJSON();
    });

    acum.type = "shape";
    return acum;
};

Shape.prototype.notifyOutThreshold = function() {};

Shape.prototype.playSound = function() {
    if(this.canPlaySound) {
        var interestingSegment = this.segments[this.markedSegmentCounter]

        var projectedTime = interestingSegment.projectedTime();
        var reproductionTime = (this.oldProjectedTime === null ? (projectedTime - this.segments[this.markedSegmentCounter].startTime) : (projectedTime - this.oldProjectedTime));
        //console.log("===> SHOULD REPRODUCE "+reproductionTime+" FROM "+this.oldProjectedTime);
        
        var finalSegment = this.segments[this.segments.length - 1];
        var totalTime = finalSegment.startTime + finalSegment.span;

        Sound.play(this.filename(), this.oldProjectedTime, reproductionTime, totalTime);        
        
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
        var segment = new Segment(this.lastPoint, point, this.clock - this.initialTime, (nextClock-this.clock), this.segments.length, this);
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
    if(this.markedSegmentCounter === null || this.markedSegmentCounter === (segment.counter-1) || this.markedSegmentCounter === (segment.counter))
        this.canPlaySound = true;
    this.markedSegmentCounter = segment.counter;
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
    //console.log("DISPLAYED SEGMENT WITH AT "+segment.startTime+" [ "+segment.span+" ] ");
};

Shape.prototype.reset = function() {
    this.markedSegmentCounter = null;
    this.canPlaySound = false;
    //this.oldProjectedTime = null;
    for(var i=0; i<this.segments.length; i++)
        this.segments[i].reset();
};

Shape.prototype.uploadName = function() {
    return '/sound/capture/' + this.sceneId + '-' + this.id;
}

Shape.prototype.filename = function() {
    return '/' + this.sceneId + '-' + this.id + '.wav';
}

var SynthShape = function(context, id, scene_id, notes) {
    Shape.call(this,context,id,scene_id);
    this.notes = notes;
    this.midi = null;
}
SynthShape.prototype = new Shape();
SynthShape.prototype.constructor = SynthShape;

SynthShape.prototype.toJSON = function() {
    var acum = new Shape().toJSON.call(this);
    acum.type = "synth_shape";
    acum.notes = this.notes;
    return acum;
};

SynthShape.prototype.notifyOutThreshold = function() {
    this.mute();
};

SynthShape.prototype.mute = function() {
    if(this.midi !== null) {
	this.midi.stop();
	this.midi = null;
    }
};

SynthShape.prototype.playSound = function() {
    console.log("CAN PLAY SOUND??? -> "+this.canPlaySound);    
    if(this.canPlaySound) {
	if(this.midi === null) {
	    console.log("PLAYING NOTES");
	    console.log(this.notes);
	    var bpm = 90;
	    var tempoUnit = 1/5;
	    this.midi = new serenade.Midi(bpm,tempoUnit);

	    this.midi.seq_notes('melody', new serenade.NoteSeq(this.notes), serenade.Synth);

	    this.midi.play(true, function(track,notation){
		console.log(track+": played "+notation.verbose());    
	    });
	}
    } else {
	if(this.midi !== null) {
	    midi.stop();
	    midi = null;
	}
    }
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
    if(scene.currentShape.constructor === Shape) {
	console.log("Writing file : " + window.scene.currentShape.uploadName());
	Wami.startRecording(window.scene.currentShape.uploadName());
    }
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
    if(scene.currentShape.constructor === Shape)
	Wami.stopRecording();
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
    timer = setInterval(computeEllapsedTime,PLAYBACK_FREQUENCY);
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
    if(scene.trackedShape !== null && scene.trackedShape.constructor === SynthShape)
	scene.trackedShape.mute();
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