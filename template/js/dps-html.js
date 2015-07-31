var frameCount = 0;
var currentWait = 0;
var elements = [];
var updateLoop;
var motionDetector;

function subclassOf(base) {
    _subclassOf.prototype = base.prototype;
    return new _subclassOf();
}
function _subclassOf() {};


function AddElement( element ){
    elements.push( element );
}

function Element( id, delay ){
    this.dom = document.getElementById(id);
    this.delay = Math.floor(currentWait + (delay * 0.06));
    currentWait = this.delay;
    this.done = false;
}
Element.prototype.canRun = function(){
    return !this.done && frameCount > this.delay;
}
Element.prototype.atActivateFrame = function(){
    return frameCount == this.delay;
}
Element.prototype.update = function(){}
Element.prototype.draw = function(){}
Element.prototype.isDone = function(){
    return false;
}
Element.prototype.checkFinish = function(){
    if(this.isDone()) this.done = true;
}

function Mover( id, delay, startpos, speed, damp, isVertical ){
    Element.call(this,id,delay)
    this.isVertical = isVertical;
    this.vel = 0;
    this.pos = startpos;
    this.speed = speed;
    this.damp = damp;
}
Mover.prototype = subclassOf(Element);
Mover.prototype.updateVel = function(){
    this.vel += ( 0 - this.pos ) * this.speed;
    this.vel *= this.damp;
    this.pos += this.vel;
}
Mover.prototype.checkFinish = function(){
    if(this.isDone()){
        this.done = true;
        this.pos = 0;
        this.vel = 0;
    }
}
Mover.prototype.update = function(){
    if( !this.canRun() ) return;
    this.updateVel();
    this.checkFinish();
    this.draw();
}
Mover.prototype.setPos = function(x,y){ this.dom.style.webkitTransform = "translate3d(" + x + "px," + y + "px,0)"; }
Mover.prototype.draw = function(){
    this.setPos( this.isVertical ? 0 : this.pos , this.isVertical ? this.pos : 0 );
}


function Slider( id, delay, startpos, isVertical ){
    Mover.call(this,id,delay,startpos,0.05,0.5,isVertical);
}
Slider.prototype = subclassOf(Mover);
Slider.prototype.isDone = function(){
    return Math.abs(this.pos) < 0.5 && Math.abs(this.vel) < 0.5;
}


function Bouncer( id, delay, startpos, isVertical ){
    Mover.call(this,id,delay,startpos,0.01,0.9,isVertical);
}
Bouncer.prototype = subclassOf(Mover);
Bouncer.prototype.isDone = function(){
    return this.pos <= 0.2 && Math.floor(this.vel) < 0.5;
}
Bouncer.prototype.updateVel = function(){
    Mover.prototype.updateVel.call(this);
    if(this.pos < 0){
        this.pos = 0;
        this.vel = -this.vel*1.0;
    }
}

function Sucker( id, delay, startpos, isVertical ){
    Mover.call(this,id,delay,startpos,-0.5,1.07,isVertical);
    this.vel = -0.3;
}
Sucker.prototype = subclassOf(Mover);
Sucker.prototype.updateVel = function(){
    this.vel *= this.damp;
    this.pos += this.vel;
}
Sucker.prototype.isDone = function(){
    return this.pos < 0;
}


function Fader( id, delay, fadein ){
    Element.call( this, id, delay );
    this.fadein = fadein;
    this.speed = 0.0125;
    this.opacity = ( this.fadein ? 0.0 : 1.0 );
}
Fader.prototype = subclassOf(Element);
Fader.prototype.update = function(){
    if( !this.canRun() ) return;
    if(this.fadein){
        if(this.opacity < 1.0){
            this.opacity += this.speed;
        } else {
            this.done = true;
        }
    } else {
        if(this.opacity > 0.0){
            this.opacity -= this.speed;
        } else {
            this.done = true;
        }
    }
    this.dom.style.opacity = this.opacity;
}

function Appear(id,delay, fadein){
    Element.call(this, id, delay);
    this.fadein = fadein;
}
Appear.prototype = subclassOf(Element);
Appear.prototype.update = function(){
    if( this.atActivateFrame() ) this.dom.style.display = this.fadein ? "block" : "none";
}


function Animation( id, delay ){
    Element.call( this, id, delay );
    this.frames = this.dom.children;
    this.size = this.frames.length;
    this.index = 0;
    this.counter = 0;
    this.speed = 2;
}
Animation.prototype = subclassOf(Element);
Animation.prototype.isDone = function(){
    return this.index >= this.size - 1;
}
Animation.prototype.setup = function(){
    for (var i = 10; i < this.frames.length; i++) {
        this.frames[i].style.webkitTransform = "translate3d(0,0,0)";
    }
}
Animation.prototype.update = function(){
    if( !this.canRun() ) return;
    this.counter++;
    if( this.counter % this.speed == 0 ){
        this.frames[this.index].style.display = "none";
        this.index++;
        this.frames[this.index].style.webkitTransform = "translate3d(800px,0px,0px)";
        this.checkFinish();
    }
}

function MotionDetector( id, delay ){
    Element.call(this,"background",delay)
    this.tiltoffset = {x:0,y:0};
    motionDetector = this;
}
MotionDetector.prototype = subclassOf(Element);
MotionDetector.prototype.detectMotion = function(e){
    motionDetector.tiltoffset.x -= e.rotationRate.beta  * 0.1;
    motionDetector.tiltoffset.y -= e.rotationRate.alpha * 0.1;
}
MotionDetector.prototype.update = function(){
    if( this.atActivateFrame() ) window.ondevicemotion = this.detectMotion;
    if( !this.canRun() ) return;
    this.tiltoffset.x *= 0.98;
    this.tiltoffset.y *= 0.98;
}


function Layer( id , delay, mod ){
    Element.call(this,id,delay);
    this.mod = mod;
    this.x = 0;
    this.y = 0;
}
Layer.prototype = subclassOf(Element);
Layer.prototype.update = function(){
    if(!this.canRun()) return;
    this.x += ((motionDetector.tiltoffset.x * this.mod) - this.x) * 0.1;
    this.y += ((motionDetector.tiltoffset.y * this.mod) - this.y) * 0.1;
    this.dom.style.webkitTransform = "translate3d(" + this.x + "px," + this.y + "px,0px)";
}




function Touch( id ){
	this.dom = document.getElementById(id);
	this.down = false;
	this.pos = {x:0,y:0};

	var self = this;

	self.touchDown = function(e){
		e.preventDefault();
		self.down = true;
	}

	self.touchXY = function(e){
		e.preventDefault();
		self.pos.x = e.pageX;
		self.pos.y = e.pageY;
	}

	self.touchUp = function(e){
		e.preventDefault();
		self.down = false;
	}

	self.dom.addEventListener( "touchstart" , function(e){ self.touchDown(e); } );
	self.dom.addEventListener( "touchmove"  , function(e){ self.touchXY(e);   } );
	self.dom.addEventListener( "touchend"   , function(e){ self.touchUp(e);   } );
}
