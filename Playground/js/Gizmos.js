
var t = 0;

var maxTrailPts = 300;
var mouseDown = false;
var adjust = null;
var selectedWidget = null;

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


class Widget {
    constructor() {
        this.R = 80.0;
        this.L = 300;
        this.x0 = 250;
        this.y0 = 400;
        this.px = this.x0;
        //this.py = 240;
        this.py = 280;
        this.py = 290;
        this.py = 200;
        this.py = 190;
        this.trail = [];
    }

    clearTrail()
    {
        this.trail = [];
    }

    update() {
        var w = -t;
        this.pt1 = {
            x: this.x0 + this.R*Math.cos(w),
            y: this.y0 + this.R*Math.sin(w)
        }
        this.pt2 = findEndPoint(this.px, this.py, this.L, this.pt1.x, this.pt1.y);
    }
    
    draw(c) {
        var ctx = c.getContext("2d");
        var x0 = this.x0, y0 = this.y0;
        var pt1 = this.pt1;
        var pt2 = this.pt2;
        var trail = this.trail;
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Draw drivepoint path
        ctx.arc(x0, y0, this.R, 0, 2 * Math.PI);
        ctx.stroke();
        // Draw anchor point
        ctx.beginPath();
        ctx.arc(this.px, this.py, 3, 0, 2 * Math.PI);
        ctx.stroke();
        // Draw crank
        ctx.moveTo(x0,y0);
        ctx.lineTo(pt1.x, pt1.y);
        ctx.stroke();
        // Draw rod
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
        trail.push(pt2);
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

class Crank {
    constructor(x0, y0, R, w) {
        this.w = w;
        this.R = R;
        this.x0 = x0;
        this.y0 = y0;
        this.trail = [];
    }

    clearTrail()
    {
        this.trail = [];
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
        this.widget = new Widget();
        this.widgets = [this.widget];
//        this.widgets.push(new Crank(400,300, 50, 2.2));
    }
    
    redraw() {
        var c = document.getElementById(this.canvName);
        var ctx = c.getContext("2d");
        ctx.clearRect(0,0,c.width, c.height);
        this.widgets.forEach(w => w.draw(c));
    }
    
    update() {
        t += 0.03;
        this.widgets.forEach(w => w.update());
        this.redraw();
    }
}

var model = null;

$(document).ready(() => {
    model = new Model();
    var w = model.widget;
    $("#c1").click(() => {
        w.clearTrail();
        w.py = 190;
    });
    $("#c2").click(() => {
        w.clearTrail();
        w.py = 220;
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
        mouseDown = true;
        adjust = "anchor";
        widgets = [model.widget];
        selectedWidget = null;
        widgets.forEach(w => {
            selectedWidget = w;
            if (dist(mp.x,mp.y,w.x0, w.y0) < 8)
                adjust = "XY0";
            if (Math.abs(dist(mp.x,mp.y, w.x0, w.y0) - w.R) < 5)
                adjust = "R";
        });
    });
    $("#myCanvas").mouseup(e => { mouseDown = false; });
    $("#myCanvas").mousemove(e => {
        if (!mouseDown)
            return;
        var w = selectedWidget;
        if (w == null)
            return;
        var mp = relativePos(e);
        console.log("x y: "+mp.x+" "+mp.y);
        if (adjust == "anchor") {
            w.px = mp.x;
            w.py = mp.y;
        }
        if (adjust == "R") {
            w.R = dist(mp.x,mp.y, w.x0,w.y0)
        }
        if (adjust == "XY0") {
            w.x0 = mp.x;
            w.y0 = mp.y;
        }
        w.clearTrail();
    });

    setInterval(() => model.update(), 1000/30);
});
