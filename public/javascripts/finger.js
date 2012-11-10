var cb_canvas = null;
var cb_ctx = null;
var cb_lastPoints = null;
var cb_easing = 0.4;

var path = [];

var timer = null;
var sampleFrequency = 100;

// Setup event handlers
window.onload = init;
function init(e) {
	cb_canvas = document.getElementById("canvas");
	cb_lastPoints = Array();

	if (cb_canvas.getContext) {
		cb_ctx = cb_canvas.getContext('2d');
		cb_ctx.lineWidth = 2;
		cb_ctx.strokeStyle = "rgb(0, 0, 0)";
	

		cb_canvas.onmousedown = startDraw;
		cb_canvas.onmouseup = stopDraw;
		cb_canvas.ontouchstart = startDraw;
		cb_canvas.ontouchstop = stopDraw;
		cb_canvas.ontouchmove = updatePos;
	}
}

function recordPath() {
  path.push(cb_lastPoints[0]);
  if (path.length > 1) {
    var last = path[path.length-1];
    var secondLast = path[path.length-2];
    
    drawLine(secondLast.x,secondLast.y,last.x,last.y);
  }
}


function startDraw(e) {
	if (e.touches) {
		// Touch event
		for (var i = 1; i <= e.touches.length; i++) {
			cb_lastPoints[i] = getCoords(e.touches[i - 1]); // Get info for finger #1
		}
	
  }
	else {
		// Mouse event
		cb_lastPoints[0] = getCoords(e);
		cb_canvas.onmousemove = updatePos;
	}
  recordPath();
  timer = setInterval(recordPath,sampleFrequency);
	return false;
}

// Called whenever cursor position changes after drawing has started
function stopDraw(e) {
	e.preventDefault();
	cb_canvas.onmousemove = null;
  clearInterval(timer);
}

function updatePos(e) {
	if (e.touches) {
		// Touch Enabled
		for (var i = 1; i <= e.touches.length; i++) {
			var p = getCoords(e.touches[i - 1]); // Get info for finger i
			cb_lastPoints[i] = {x: p.x, y: p.y};
		}
	}
	else {
		// Not touch enabled
		var p = getCoords(e);
		cb_lastPoints[0] = {x: p.x, y: p.y};
	}
	return false;
}

// Draw a line on the canvas from (s)tart to (e)nd
function drawLine(sX, sY, eX, eY) {
  cb_ctx.beginPath();
	cb_ctx.moveTo(sX, sY);
	cb_ctx.lineTo(eX, eY);
  cb_ctx.stroke();
	cb_ctx.closePath();


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