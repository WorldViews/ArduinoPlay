
var t = 0;

var mouseDown = false;
var selectedWidget = null;
var selectedGrip = null;
var showTrails = true;

function rand(n)
{
    return Math.floor(Math.random()*1000000) % n;
}

function getClockTime()
{
    return new Date().getTime()/1000.0;
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function remove(array, element) {
    const index = array.indexOf(element);
    
    if (index !== -1) {
        array.splice(index, 1);
    }
}

function relativePos ( event ) {
  var bounds = event.target.getBoundingClientRect();
  var x = event.clientX - bounds.left;
  var y = event.clientY - bounds.top;
  return {x: x, y: y};
}

function dist(x0,y0,x1,y1)
{
    var dx = x1-x0;
    var dy = y1-y0;
    return Math.sqrt(dx*dx+dy*dy);
}

var numObjs = 0;
function getUniqueName(baseName)
{
    baseName = baseName || "Obj";
    numObjs++;
    return "_"+baseName+"_"+numObjs;
}

class Widget {
    constructor(opts) {
        opts.type = this.constructor.name;
        opts.name = opts.name || getUniqueName(opts.type);
        this.opts = opts;
        this.name = opts.name;
        this.selected = false;
    }
    
    clear()
    {
        this.trail = [];
    }
}

class Hole extends Widget {
    constructor(opts) {
        super(opts);
        this.R = opts.R || 20;
        this.x0 = opts.x0;
        this.y0 = opts.y0;
        this.strokeStyle = "#000000";
        this.fillStyle = "#000000";
        this.fillStyle = null;
    }

    setOccupied(v) {
	this.occupied = v;
	this.fillStyle = v ? "#000000" : null;
    }

    findGrip(pt) {
        if (dist(this.x0, this.y0, pt.x, pt.y) < this.R)
            return "R";
        return null;
    }

    adjust(grip, pt) {
        this.x0 = pt.x0;
        this.y0 = pt.y0;
    }
    
    update() {
        var a = -this.w*t;
        this.pt2 = {
            x: this.x0 + this.R*Math.cos(a),
            y: this.y0 + this.R*Math.sin(a)
        }
    }


    draw(c) {
        var ctx = c.getContext("2d");
        var x0 = this.x0, y0 = this.y0;
        var trail = this.trail;
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        if (this.selected) {
            ctx.strokeStyle = "#ff0000";
        }
        ctx.beginPath();
        // Draw drivepoint path
        ctx.arc(x0, y0, this.R, 0, 2 * Math.PI);
        ctx.stroke();
	if (this.fillStyle)
	    ctx.fill();
    }
}

class Game {
    constructor(canvName) {
        this.canvName = canvName || "myCanvas";
        this.widgets = [];
        this.widgetsByName = {};
        this.createHoles(3,3);
        this.delay = 1000;
	this.lingerTime = 2.5;
	this.start();
    }

    start() {
	this.lastMoveTime = 0;
	this.molePos = 0;
	this.molePoints = -1;
	this.farmerPoints = 0;
        this.handleTick();
    }
    

    handleTick() {
        console.log("tick");
        var inst = this;
	var t = getClockTime();
	var dt = t - this.lastMoveTime;
	if (dt > this.lingerTime) {
	    this.molePoints++;
	    this.moveMoles();
	}
        this.timeout = setTimeout(e => inst.handleTick(), 1000/30);
    }

    moveMoles() {
	console.log("move moles");
	this.lastMoveTime = getClockTime();
	var i = rand(this.widgets.length);
	this.widgets.forEach(w => w.setOccupied(false));
	this.widgets[i].setOccupied(true);
    }

    createHoles(n,m) {
        this.widgets = [];
        this.widgetsByName = {};
        var left = 100;
        var top = 100;
        var wd = 100;
        var ht = 100;
        for (var i=0; i<n; i++) {
            for (var j=0; j<n; j++) {
                name = "cell_"+i+"_"+j;
                var x0 = left + i*wd;
                var y0 = top +  j*ht;
                this.addWidget(new Hole({x0, y0, name}));
            }
        }
    }

    addWidget(w) {
        this.widgets.push(w);
    }
    
    redraw() {
        var c = document.getElementById(this.canvName);
        var ctx = c.getContext("2d");
        ctx.clearRect(0,0,c.width, c.height);
        this.widgets.forEach(w => w.draw(c));
    }
    
    clear() {
        this.widgets.forEach(w => w.clear());
    }

    select(sw) {
        this.widgets.forEach(w => {w.selected = (w == sw)});true;
    }

    handleHit(w) {
	if (w.occupied) {
	    this.farmerPoints++;
	    //this.molePoints--;
	    this.moveMoles();
	}
    }
    
    update() {
        t += this.dt;
        this.redraw();
        var statusText = "mole: "+this.molePoints+
	    " farmer: "+this.farmerPoints;
	var score = this.farmerPoints - this.molePoints;
	statusText += " score: "+score;
        $("#status").html(statusText);
    }
}

var game = null;

$(document).ready(() => {
    game = new Game();
    $("#play").click(() => {
        game.start();
    });
    $("#trails").click(() => {
    });
    $("#delete").click(() => {
    });
    $("#myCanvas").mousedown(e => {
        var mp = relativePos(e);
        mouseDown = true;
        selectedWidget = null;
        game.widgets.forEach(w => {
            var grip = w.findGrip(mp);
            if (grip != null) {
                selectedWidget = w;
            }
        });
        console.log("selectedWidget: "+selectedWidget);
        //game.select(selectedWidget);
        game.handleHit(selectedWidget);
    });
    $("#myCanvas").mouseup(e => { mouseDown = false; });
    $("#myCanvas").mousemove(e => {
        if (!mouseDown)
            return;
        var w = selectedWidget;
        if (w == null)
            return;
        var mp = relativePos(e);
        //console.log("x y: "+mp.x+" "+mp.y);
        //w.selected = true;
        //w.adjust(selectedGrip, mp);
        game.clear();
    });

    setInterval(() => game.update(), 1000/30);
});

