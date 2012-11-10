// Author: Richard Garside - www.nogginbox.co.uk [2010]

var cb_canvas = null;
var cb_ctx = null;
var cb_lastPoints = null;
var cb_easing = 0.4;

// Setup event handlers
window.onload = init;
function init(e) {
	cb_canvas = document.getElementById("canvas");

	cb_lastPoints = Array();

	if (cb_canvas.getContext) {
		cb_ctx = cb_canvas.getContext('2d');
		cb_ctx.lineWidth = 2;
		cb_ctx.strokeStyle = "rgb(0, 0, 0)";
		cb_ctx.beginPath();

		cb_canvas.onmousedown = startDraw;
		cb_canvas.onmouseup = stopDraw;
		cb_canvas.ontouchstart = startDraw;
		cb_canvas.ontouchstop = stopDraw;
		cb_canvas.ontouchmove = drawMouse;
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
		cb_canvas.onmousemove = drawMouse;
	}
	
	return false;
}

// Called whenever cursor position changes after drawing has started
function stopDraw(e) {
	e.preventDefault();
	cb_canvas.onmousemove = null;
}

function drawMouse(e) {
	if (e.touches) {
		// Touch Enabled
		for (var i = 1; i <= e.touches.length; i++) {
			var p = getCoords(e.touches[i - 1]); // Get info for finger i
			cb_lastPoints[i] = drawLine(cb_lastPoints[i].x, cb_lastPoints[i].y, p.x, p.y);
		}
	}
	else {
		// Not touch enabled
		var p = getCoords(e);
		cb_lastPoints[0] = drawLine(cb_lastPoints[0].x, cb_lastPoints[0].y, p.x, p.y);
	}
	cb_ctx.stroke();
	cb_ctx.closePath();
	cb_ctx.beginPath();

	return false;
}

// Draw a line on the canvas from (s)tart to (e)nd
function drawLine(sX, sY, eX, eY) {
	cb_ctx.moveTo(sX, sY);
	cb_ctx.lineTo(eX, eY);
	return { x: eX, y: eY };
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