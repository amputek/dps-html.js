function update(){
	updateLoop = webkitRequestAnimationFrame(update);
	for (var i = 0; i < elements.length; i++) {
		elements[i].update();
	}
	frameCount++;
}

function init(){
	update();
}

function close(){ webkitCancelRequestAnimationFrame(updateLoop) }
window.onload = init;
window.onDisappear = close;
