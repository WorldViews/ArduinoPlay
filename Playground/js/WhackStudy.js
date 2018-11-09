
var t = 0;

var role = "farmer";
var showTrails = true;
var colors = {};
colors[[0,0]] = 'green';
colors[[1,0]] = 'red';
colors[[2,0]] = 'blue';
colors[[0,1]] = 'blue';
colors[[1,1]] = 'yellow';
colors[[2,1]] = 'green';

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
}

class Hole extends Widget {
    constructor(opts) {
        super(opts);
        this.R = opts.R || 20;
        this.x0 = opts.x0;
        this.y0 = opts.y0;
        this.i = opts.i;
        this.j = opts.j;
        this.strokeStyle = "#000000";
        this.strokeWidthe = 1;
        this.fillStyle = "#000000";
        this.fillStyle = null;
        if (opts.color)
            this.fillStyle = opts.color;
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
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        if (this.selected) {
            //ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 8;
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
        this.mouseDown = false;
        this.widgetsByName = {};
        this.numRows = 2;
        this.numCols = 3;
        this.createHoles(this.numRows, this.numCols);
        this.delay = 1000;
        this.auto = false;
	this.lingerTime = 2.5;
        var inst = this;
        var str = "No muse portal";
        if (0) {
            this.portal = new MUSEPortal();
            this.portal.registerMessageHandler(msg => inst.handleMessage(msg));
            str = "server: "+this.portal.server;
        }
        this.initROS();
	this.start();
        //$("#debug").html(str);
    }

    initROS() {
	let ros = new ROSLIB.Ros({
	    url : 'ws://192.168.16.177:9090'
	});

	ros.on('connection', function() {
	    console.log('Connected to websocket server.');
	});

	ros.on('error', function(error) {
	    console.log('Error connecting to websocket server: ', error);
	});

	ros.on('close', function() {
	    console.log('Connection to websocket server closed.');
	});

        this.ros = ros;
        /*
		var cmdVel = new ROSLIB.Topic({
		  ros : ros,
		  name : '/hit_num',
		  messageType : 'std_msgs/Int32'
	    });
        */
        /*
	  var cur_pos = new ROSLIB.Topic({
		  ros : ros,
		  name : '/joint_states',
		  messageType : 'sensor_msgs/JointState'
	  });

	  cur_pos.subscribe(function(message) {
		//console.log('Received message on ' + JSON.stringify(message));
		console.log('Received message on ' + JSON.stringify(message.position));
		//cur_pos.unsubscribe();
	  });
        */
        let hit_pos = new ROSLIB.Topic({
            ros : ros,
            name : '/hit_num',
            messageType : 'std_msgs/Int32'
        });
        this.hit_pos = hit_pos;
        
	var cur_pos = new ROSLIB.Topic({
            ros : ros,
            name : '/joint_states',
            messageType : 'sensor_msgs/JointState'
        });

        cur_pos.subscribe(function(message) {
            //console.log('Received message on ' + JSON.stringify(message));
	    var str = JSON.stringify(message.position);
            console.log('Received message on ' + str);
	    $("#status").html(str)
            //cur_pos.unsubscribe();
        });
    }
    
    start() {
	this.lastMoveTime = 0;
	this.molePos = 0;
	this.molePoints = -1;
	this.farmerPoints = 0;
        this.handleTick();
    }

    handleTick() {
        if (role == "mole") {
            this.handleTickAsMole();
        }
        else
            this.handleTickAsFarmer();
    }

    handleTickAsFarmer() {
        //console.log("tick");
        var inst = this;
	var t = getClockTime();
	var dt = t - this.lastMoveTime;
	if (dt > this.lingerTime && this.auto) {
	    this.molePoints++;
	    this.moveMoles();
	}
        this.timeout = setTimeout(e => inst.handleTick(), 1000/30);
    }

    moveMoles() {
	console.log("move moles");
	var i = rand(this.widgets.length);
        this.setMolePosition(i);
    }

    setMolePosition(i)
    {
	console.log("setMolePosition "+i);
	this.lastMoveTime = getClockTime();
	this.widgets.forEach(w => w.setOccupied(false));
	this.widgets[i].setOccupied(true);
    }

    sendMessage(msg) {
        //console.log("sendMessage "+JSON.stringify(msg));
        if (this.portal)
            this.portal.sendMessage(msg);
    }
    
    handleMessage(msg) {
        //console.log("handleMessage "+JSON.stringify(msg));
        if (msg.msgType == "whack.setMolePos") {
            this.setMolePosition(msg.index);
        }
        else if (msg.msgType == "whack.hitHole") {
            console.log("hitHole: "+msg.index);
            this.handleHitAsFarmer(this.widgets[msg.index]);
        }
        else if (msg.msgType == "whack.mousePos") {
            var pt = msg.pt;
            this.otherMousePt = pt;
        }
        else {
            //console.log("unexpected message "+JSON.stringify(msg));
        }
    }
    
    createHoles(nrows,ncols) {
        this.widgets = [];
        this.widgetsByName = {};
        this.positions = {};
        var left = 100;
        var top = 100;
        var wd = 100;
        var ht = 100;
        var idx = 0;
        for (var i=0; i<ncols; i++) {
            for (var j=0; j<nrows; j++) {
                name = "cell_"+i+"_"+j;
                var x0 = left + i*wd;
                var y0 = top +  j*ht;
                var color = colors[[i,j]];
                var hole = new Hole({i, j, x0, y0, name, color});
                hole.idx = idx++;
                this.positions[hole.idx] = {x: x0, y: y0};
                this.addWidget(hole);
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
        if (this.otherMousePt) {
            var mp = this.otherMousePt;
            ctx.beginPath();
            // Draw drivepoint path
            ctx.arc(mp.x, mp.y, 4, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
    
    clear() {
        this.widgets.forEach(w => w.clear());
    }

    select(sw) {
        this.widgets.forEach(w => {w.selected = (w == sw)});true;
    }

    findWidget(pt) {
        var widget = null;
        game.widgets.forEach(w => {
            var grip = w.findGrip(pt);
            if (grip != null) {
                widget = w;
            }
        });
        return widget;
    }

    handleHit(w) {
        if (w == null)
            return;
        if (role == "mole")
            this.handleHitAsMole(w);
        else
            this.handleHitAsFarmer(w);
    }
    
    handleHitAsFarmer(w) {
        console.log("handleHitAsFarmer", w);
        if (role == "farmer")
            this.sendMessage({'msgType': 'whack.hitHole', 'index': w.idx});
	if (w.occupied) {
	    this.farmerPoints++;
            w.setOccupied(false);
	    //this.molePoints--;
            if (this.auto)
	        this.moveMoles();
	}
		var num = w.idx;
		
        var pos = this.positions[num];
        console.log("i: "+w.i+"  j: "+w.j);
        console.log("pos: "+pos.x+" "+pos.y);
        console.log("num: "+num);
        this.select(w);
	var hit_number = new ROSLIB.Message({
	    data : num
	})
        this.hit_pos.publish(hit_number);
    }

    handleHitAsMole(w) {
        console.log("handleHitAsMole", w);
        this.setMolePosition(w.idx);
        this.sendMessage({'msgType': 'whack.setMolePos', 'index': w.idx});
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
    /*
    if (role == "mole") {
        $("#banner").html("You are the mole - choose your holes well!");
    }
    else {
        $("#banner").html("You are the gardner - whack that mole!");
    }
    */
    $("#play").click(() => {
        game.start();
    });
    $("#myCanvas").mousedown(e => {
        game.mouseDown = true;
        var pt = relativePos(e);
        var widget = game.findWidget(pt);
        console.log("selected widget: "+widget);
        game.handleHit(widget);
    });
    $("#myCanvas").mouseup(e => { game.mouseDown = false; });
    $("#myCanvas").mousemove(e => {
        var pt = relativePos(e);
        var msg = {'msgType': 'whack.mousePos', role, pt};
        //game.sendMessage(msg);
    });
    setInterval(() => game.update(), 1000/30);
});

