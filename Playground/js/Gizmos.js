
var t = 0;

var maxTrailPts = 300;
var mouseDown = false;
var selectedWidget = null;
var selectedGrip = null;
var showTrails = true;

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

function findEndPoint(px, py, L, x,y)
{
    var vx = px - x;
    var vy = py - y;
    var l = Math.sqrt(vx*vx + vy*vy);
    var nvx = vx / l;
    var nvy = vy / l;
    return {x: x + L*nvx, y: y + L*nvy};
}

var numObjs = 0;
function getUniqueName(baseName)
{
    numObjs++;
    return "_"+baseName+"_"+numObjs;
}

class Widget {
    constructor(opts) {
        opts.type = this.constructor.name;
        opts.name = opts.name || getUniqueName(opts.type);
        this.opts = opts;
        this.name = opts.name;
        this.trail = [];
    }
    
    clearTrail()
    {
        this.trail = [];
    }

    getDef() {
        var opts = this.opts;
        if (opts.driver && typeof opts.driver != "string")
            opts.driver = opts.driver.name;
        return this.opts
    }
}

class SlipRod extends Widget {
    constructor(opts) {
        super(opts);
        this.L = opts.L || 50;
        this.px = opts.px;
        this.py = opts.py;
        //this.py = 240;
        this.driver = opts.driver;
    }

    
    update() {
        this.pt1 = this.driver.pt2;
        this.pt2 = findEndPoint(this.px, this.py, this.L, this.pt1.x, this.pt1.y);
    }
    
    findGrip(mp) {
        if (dist(mp.x,mp.y, this.px, this.py) < 8)
            return "slideHole";
        if (dist(mp.x,mp.y, this.pt2.x, this.pt2.y) < 5)
            return "endpoint";
        return null;
    }

    adjust(grip, mp) {
        console.log("crank.adjust "+mp);
        if (grip == "slideHole") {
            this.px = mp.x;
            this.py = mp.y;
        }
        if (grip == "endpoint") {
            this.L = dist(this.pt1.x, this.pt1.y, mp.x, mp.y);
        }
        else {
            console.log("Unexpected grip name "+grip);
        }
    }

    draw(c) {
        var ctx = c.getContext("2d");
        var trail = this.trail;
        ctx.lineWidth = 1;
        // Draw anchor point
        ctx.beginPath();
        ctx.arc(this.px, this.py, 3, 0, 2 * Math.PI);
        ctx.stroke();
        // Draw end point
        ctx.beginPath();
        ctx.arc(this.pt2.x, this.pt2.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
        // Draw rod
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.moveTo(this.pt1.x, this.pt1.y);
        ctx.lineTo(this.pt2.x, this.pt2.y);
        ctx.stroke();
        if (showTrails)
            trail.push(this.pt2);
        // draw trail
        ctx.lineWidth = 0.5;
        if (trail.length > maxTrailPts)
            trail = trail.slice(1);
        //console.log("trail: "+trail);
        ctx.beginPath();
        trail.forEach(pt => ctx.lineTo(pt.x,pt.y));
        ctx.stroke();
    }
}

class Crank extends Widget {
    constructor(opts) {
        super(opts);
        this.w = opts.w || 1;
        this.R = opts.R || 20;
        this.x0 = opts.x0;
        this.y0 = opts.y0;
    }

    update() {
        var a = -this.w*t;
        this.pt2 = {
            x: this.x0 + this.R*Math.cos(a),
            y: this.y0 + this.R*Math.sin(a)
        }
    }

                
    findGrip(mp) {
        var d = dist(mp.x,mp.y, this.x0, this.y0);
        if (d < 5)
            return "XY0";
        if (Math.abs(d - this.R) < 5)
            return "R";
        return null;
    }

    adjust(grip, mp) {
        console.log("crank.adjust "+mp);
        if (grip == "R") {
            this.R = dist(mp.x,mp.y, this.x0,this.y0)
        }
        else if (grip == "XY0") {
            this.x0 = mp.x;
            this.y0 = mp.y;
        }
        else {
            console.log("Unexpected grip name "+grip);
        }
    }

    draw(c) {
        var ctx = c.getContext("2d");
        var x0 = this.x0, y0 = this.y0;
        var pt2 = this.pt2;
        var trail = this.trail;
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Draw drivepoint path
        ctx.arc(x0, y0, this.R, 0, 2 * Math.PI);
        ctx.stroke();
        // Draw anchor point
        // Draw crank
        ctx.moveTo(x0,y0);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
        // draw trail
        ctx.lineWidth = 0.5;
        if (trail.length > maxTrailPts)
            trail = trail.slice(1);
        //console.log("trail: "+trail);
        ctx.beginPath();
        trail.forEach(pt => ctx.lineTo(pt.x,pt.y));
        ctx.stroke();
    }
}

class Model {
    constructor(canvName) {
        this.canvName = canvName || "myCanvas";
        this.widgets = [];
        this.widgetsByName = {};
        //this.loadDefault();
        this.dt = 0.03;
    }

    load(specs) {
        console.log("cloaning specs");
        specs = clone(specs);
        model.specs = specs;
        var inst = this;
        this.widgets = [];
        this.widgetsByName = {};
        specs.widgets.forEach(ws => {
            if (ws.type == "SlipRod") {
                inst.addWidget(new SlipRod(ws));
            } else if (ws.type == "Crank") {
                inst.addWidget(new Crank(ws));
            }
            else {
                error("Unrecognized type "+ws.type);
            }
        });
        this.widgets.forEach(w => {
            if (w.opts.driver instanceof Widget) {
                w.driver = w.opts.driver;
                return;
            }
            var dw = this.widgetsByName[w.opts.driver];
            if (dw == null) {
                console.log("*** widget "+w.name+
                            " cannot find driver named "+w.opts.driver);
                return;
            }
            w.driver = dw;
            w.opts.driver = dw;
        });
    }

    addWidget(w) {
        this.widgetsByName[w.name] = w;
        this.widgets.push(w);
    }
    
    loadDefault() {
        var crank = new Crank({x0: 250, y0: 400, R: 50, w: 2.2});
        var slipRod = new SlipRod({px: 250, py: 200, L: 300, driver: crank});
        var crank2 = new Crank({x0: 350, y0: 300, R: 20, w: 1.1});
        var slipRod2 = new SlipRod({px: 320, py: 200, L: 200, driver: crank2});
        var slipRod3 = new SlipRod({px: 120, py: 100, L: 200, driver: slipRod});
        this.widgets = [crank, slipRod, crank2, slipRod2, slipRod3];
    }
    
    dump() {
        var def = this.getDef();
        
        console.log(JSON.stringify(def, null, 3));
    }

    deleteWidget(w) {
        if (w == null)
            return;
        delete this.widgetsByName[w.name];
        remove(this.widgets, w);
    }
    
    getDef() {
        var def = {type: "Model", widgets: []};
        this.widgets.forEach(w => {
            def.widgets.push(w.getDef());
        });
        return def;
    }

    clear() {
        this.widgets.forEach(w => w.clearTrail());
    }
    
    showTrails(v) {
        if (!v)
            this.clear();
        showTrails = v;
    }

    redraw() {
        var c = document.getElementById(this.canvName);
        var ctx = c.getContext("2d");
        ctx.clearRect(0,0,c.width, c.height);
        this.widgets.forEach(w => w.draw(c));
    }
    
    clear() {
        this.widgets.forEach(w => w.clearTrail());
    }

    play() { this.dt = 0.02; }

    pause() { this.dt = 0; }
    
    update() {
        t += this.dt;
        this.widgets.forEach(w => w.update());
        this.redraw();
        var statusText = "";
        if (selectedWidget) {
            statusText += selectedWidget.name;
            if (selectedGrip)
                statusText += " "+selectedGrip;
        }
        $("#status").html(statusText);
    }
}

function togglePlay()
{
    model.dump();
    if ($("#play").val() == "play") {
        model.play();
        $("#play").val("pause");
    }
    else {
        model.pause();
        $("#play").val("play");
    }
}

function toggleTrails()
{
    var bt = $("#trails");
    model.dump();
    if (bt.val() == "trails") {
        model.showTrails(true);
        bt.val("no trails");
    }
    else {
        model.showTrails(false);
        bt.val("trails");
    }
}

var model = null;

$(document).ready(() => {
    model = new Model();
    model.load(mod1);
    var w = model.widget;
    $("#play").click(() => {
        togglePlay();
    });
    $("#trails").click(() => {
        toggleTrails();
    });
    $("#delete").click(() => {
        model.deleteWidget(selectedWidget);
    });
    $("#c1").click(() => {
        model.load(mod1);
    });
    $("#c2").click(() => {
        model.load(mod2);
    });
    $("#c3").click(() => {
        w.clearTrail();
        w.py = 240;
    });
    $("#c4").click(() => {
        w.clearTrail();
        w.py = 280;
    });
    $("#c5").click(() => {
        w.clearTrail();
        w.py = 295;
    });
    $("#myCanvas").mousedown(e => {
        var mp = relativePos(e);
        if (e.shiftKey) {
            if (selectedWidget) {
                var sr = new SlipRod(
                    {L: 200, px: mp.x, py: mp.y,
                     driver: selectedWidget});
                model.addWidget(sr);
            }
        }
        mouseDown = true;
        selectedGrip = null;
        selectedWidget = null;
        model.widgets.forEach(w => {
            if (selectedWidget == null) {
                selectedGrip = w.findGrip(mp);
                if (selectedGrip != null) {
                    selectedWidget = w;
                }
            }
        });
        console.log("selectedGrip: "+selectedGrip);
        console.log("selectedWidget: "+selectedWidget);
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
        w.adjust(selectedGrip, mp);
        model.clear();
    });

    setInterval(() => model.update(), 1000/60);
});

var mod1 =
{
   "type": "Model",
   "widgets": [
      {
         "x0": 250,
         "y0": 400,
         "R": 50,
         "w": 2.2,
         "type": "Crank",
         "name": "_Crank_1"
      },
      {
         "px": 250,
         "py": 200,
         "L": 300,
         "driver": "_Crank_1",
         "type": "SlipRod",
         "name": "_SlipRod_2"
      },
      {
         "x0": 350,
         "y0": 300,
         "R": 20,
         "w": 1.1,
         "type": "Crank",
         "name": "_Crank_3"
      },
      {
         "px": 320,
         "py": 200,
         "L": 200,
         "driver": "_Crank_3",
         "type": "SlipRod",
         "name": "_SlipRod_4"
      },
      {
         "px": 120,
         "py": 100,
         "L": 200,
         "driver": "_SlipRod_2",
         "type": "SlipRod",
         "name": "_SlipRod_5"
      }
   ]
};

var mod2 =
{
   "type": "Model",
   "widgets": [
      {
         "x0": 250,
         "y0": 400,
         "R": 50,
         "w": 2.2,
         "type": "Crank",
         "name": "_Crank_1"
      },
      {
         "px": 250,
         "py": 200,
         "L": 300,
         "driver": "_Crank_1",
         "type": "SlipRod",
         "name": "_SlipRod_2"
      },
      {
         "px": 120,
         "py": 100,
         "L": 200,
         "driver": "_SlipRod_2",
         "type": "SlipRod",
         "name": "_SlipRod_5"
      }
   ]
}