
var speed = 5;
var lowSpeed = 0;
var ASCII = {};
ASCII.A = 65;
ASCII.S = 83;
var MASS = 0.2;
var x0 = -2;
var L1 = 0.1;
var L2 = 1.5;
var motors = [];
var radius = 0.05;
var app = null;
var pend1, pend2, pend3, pend4;
var world;
var plane;
var sys;

function setup() {
    var opts = {foo: 25, hideGUI: true};
    var app = new p2.WebGLRenderer(initFun, opts);
    setupKeys();
}

function initFun(opts)
{
    console.log("initFun", opts);
    
    var g = 5;
    //g = 0.02;
    g = 5;
    world = new p2.World({
        gravity : [0,-g]
    });

    this.setWorld(world);

    world.solver.tolerance = 0.001;

    // Create ground
    var planeShape = new p2.Plane();
    plane = new p2.Body({
        //position : [0, -2]
        position : [0, 0]
    });
    plane.addShape(planeShape);
    world.addBody(plane);

    this.frame(3,0,8,8);
    sys = new System1(world, plane);
    //sys = new System2(world, plane);
    //sys = new SpringSystem(world, plane);
 }

function setMotor(pin)
{
    pin.enableMotor();
    pin.setMotorSpeed(0);
    motors.push(pin);
}

class System0 {
    constructor(world, plane) {
        var h = 3.0;
        var x = x0;
        pend1 = new Pendulum(world, plane, x, h, MASS, [L1, L2]);
        setMotor(pend1.pins[0]);
        x += 4;
        pend2 = new Pendulum(world, plane, x, h, MASS, [1.5, 0.5]);
        setMotor(pend2.pins[1]);
        this.spring1 = new p2.LinearSpring(
            pend1.bodies[1], pend2.bodies[1],
            { stiffness: 0.00001, damping: 0.0001 });
        world.addSpring(this.spring1);
    }
}

class System1 {
    constructor(world, plane) {
        var h = 3.0;
        var x = x0;
        var L0 = 0.5
        var spacing = 3;
        var k1 = 0.00001;
        var k2 = 100.0;
        var damping1 = 0.000001;
        var damping2 = 10;
        pend1 = new Pendulum(world, plane, x, h, MASS, [L0]);
        x += spacing;
        pend2 = new Pendulum(world, plane, x, h, MASS, [L0, 1.2]);
        x += spacing;
        pend3 = new Pendulum(world, plane, x, h, MASS, [L0]);
        setMotor(pend1.pins[0]);
        setMotor(pend3.pins[0]);
        this.spring1 = new p2.LinearSpring(
            pend1.bodies[0], pend2.bodies[0],
            { stiffness: k2, damping: damping2 });
        world.addSpring(this.spring1);
        this.spring2 = new p2.LinearSpring(
            pend2.bodies[0], pend3.bodies[0],
            { stiffness: k2, damping: damping2 });
        world.addSpring(this.spring2);
    }
}

class System2 {
    constructor(world, plane) {
        var h = 3.0;
        var x = x0;
        var L0 = 0.5
        var spacing = 3;
        var k1 = 0.00001;
        var k2 = 100.0;
        var damping1 = 0.000001;
        var damping2 = 10;
        pend1 = new Pendulum(world, plane, x, h, MASS, [L0]);
        x += spacing;
        pend2 = new Pendulum(world, plane, x, h, MASS, [L0, 1.2]);
        x += spacing;
        pend3 = new Pendulum(world, plane, x, h, MASS, [L0, 1.2]);
        x += spacing;
        pend4 = new Pendulum(world, plane, x, h, MASS, [L0]);
        setMotor(pend4.pins[0]);
        this.spring1 = new p2.LinearSpring(
            pend1.bodies[0], pend2.bodies[0],
            { stiffness: k2, damping: damping2 });
        world.addSpring(this.spring1);
        this.spring2 = new p2.LinearSpring(
            pend2.bodies[0], pend3.bodies[0],
            { stiffness: k1, damping: damping1 });
        world.addSpring(this.spring2);
        this.spring3 = new p2.LinearSpring(
            pend3.bodies[0], pend4.bodies[0],
            { stiffness: k2, damping: damping2 });
        world.addSpring(this.spring3);
    }
}

class SpringSystem {
    constructor(world, plane, nblocks, mass) {
        nblocks = nblocks || 20;
        mass = mass || 0.05;
        var L0 = 0.1;
        var r = 0.08;
        var h = 2.0;
        var h2 = 0;
        var x = x0;
        var spacing = 0.45;
        var k = 120;
        k = 10;
        var damping = 0.0;
        var Spring = p2.LinearSpring;
        var havePend1 = false;
        //var Spring = p2.Spring;
        this.blocks = [];
        var prevBody = null;
        this.pend1 = null;
        if (havePend1) {
            this.pend1 = new Pendulum(world, plane, x, h+h2, MASS, [L0]);
            x += spacing;
            prevBody = this.pend1.bodies[0];
        }
        for (var i=0; i<nblocks; i++) {
            var shape = new p2.Circle({ radius: r });
            var body = new p2.Body({
                mass: mass,
                position: [x, h]
            });
            body.addShape(shape);
            world.addBody(body);
            this.blocks.push(body);
            if (prevBody) {
                var spring = new Spring(
                    prevBody, body,
                    { stiffness: k, damping: damping, length: 0 });
                world.addSpring(spring);
            }
            x += spacing;
            prevBody = body;
        }
        pend2 = new Pendulum(world, plane, x, h+h2, MASS, [L0]);
        spring = new Spring(
            prevBody, pend2.bodies[0],
            { stiffness: k, damping: damping, restLength: 0});
        world.addSpring(spring);
        if (this.pend1)
            setMotor(this.pend1.pins[0]);

        this.cbody = this.blocks[0];
        //this.cb = new ControlBox(world, {attachTo: this.blocks[0]});
    }

    set(x,y) {
        this.cbody.position[0] = 0; this.cbody.position[1]=y;
    }
    moveControl(dx,dy) {
        this.cbody.position[0] += dx;
        this.cbody.position[1] += dy;
    }
}

class ControlBox {
    constructor(world, opts) {
        opts = opts || {};
        var position = opts.position || [0,0];
        if (opts.attachTo) {
            position = [opts.attachTo.position[0]-.1, opts.attachTo.position[1]];
        }
        var r = opts.r || .05;
        var shape = new p2.Circle({ radius: r });
        this.body = new p2.Body({
            mass: 0.01,
            position
        });
        this.body.addShape(shape);
        world.addBody(this.body);
        if (opts.attachTo) {
            this.spring = new p2.LinearSpring(
                this.body, opts.attachTo,
                { stiffness: 0.01}
            );
            world.addSpring(this.spring);
        }
    }

    setPos(x,y) {
        this.body.position[0] = x;
        this.body.position[1] = y;
    }
}

/*
Add multiple pendulum with specificed lengths.
*/
class Pendulum {
    constructor(world, ground, x0, h, mass, lengths, r) {
        r = r || radius;
        this.bodies = [];
        this.pins = [];
        var prevBody = null;
        var prevL;
        var x = x0;
        for (var i = 0; i < lengths.length; i++) {
            var L = lengths[i];
            var shape = new p2.Capsule({ length: L, radius: r });
            var body = new p2.Body({
                mass: mass,
                position: [x + L / 2.0, h]
            });
            body.addShape(shape);
            this.bodies.push(body);
            world.addBody(body);
            var pin;
            if (i == 0) {
                pin = new p2.RevoluteConstraint(ground, body, {
                    localPivotA: [x, h],
                    localPivotB: [-L / 2.0, 0],
                    collideConnected: false
                });
            }
            else {
                pin = new p2.RevoluteConstraint(prevBody, body, {
                    localPivotA: [prevL / 2.0, 0],
                    localPivotB: [-L / 2.0, 0],
                    collideConnected: false
                });
            }
            world.addConstraint(pin);
            this.pins.push(pin);
            prevBody = body;
            prevL = L;
            x += L;
        }
    }
}

function setMotorSpeeds(speed, mots)
{
    mots = mots || motors;
    mots.forEach(motor => {
        motor.setMotorSpeed(speed);
    });
}

function setupKeys() {
      $(document).ready(function() {
         console.log("**** document.ready");
         $(document).keydown(function(e) {
             console.log("**** keydown "+e.which);
             if (e.which == ASCII.A) {
                 console.log("*** a ****");
                 motors.forEach(motor => {
                     motor.setMotorSpeed(speed);
                 });
             }
             else if (e.which == ASCII.S) {
                console.log("*** b ****");
                 motors.forEach(motor => {
                     motor.setMotorSpeed(-speed);
                 });
             }
         });
         $(document).keyup(function(e) {
             console.log("**** keyup "+e.which);
             motors.forEach(motor => {
                 motor.setMotorSpeed(lowSpeed);
             });
         });
      });
}


