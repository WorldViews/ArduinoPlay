
var speed = 5;
var ASCII = {};
ASCII.A = 65;
ASCII.S = 83;
var MASS = 0.2;
var x0 = -1;
var L1 = 0.1;
var L2 = 1.5;
var motors = [];
var radius = 0.05;
var app = null;

function setup() {
    var app = new p2.WebGLRenderer(initFun);
    setupKeys();
}

function initFun(){

    var world = new p2.World({
        gravity : [0,-5]
    });

    this.setWorld(world);

    world.solver.tolerance = 0.001;

    // Create ground
    var planeShape = new p2.Plane();
    var plane = new p2.Body({
        //position : [0, -2]
        position : [0, 0]
    });
    plane.addShape(planeShape);
    world.addBody(plane);

    var h = 3.0;
    var x = x0;
    var motor;
    pins = addPend2(world, plane, x, h, L1, L2, MASS);
    setMotor(pins[0]);
    x += 4;
    //pins = addPend(world, plane, x, h, MASS, [0.5, 1.0, 1.0]);
    //setMotor(pins[2]);
    pins = addPend(world, plane, x, h, MASS, [1.5, 0.5]);
    setMotor(pins[1]);
    this.frame(3,0,8,8);
}

/*
Add just one double pendulum with specified lengths
*/
function addPend2(world, ground, x0, h, L1, L2, mass, r)
{
    r = r || radius;
    var capsuleShape1 = new p2.Capsule({ length: L1, radius:  r });
    var capsuleShape2 = new p2.Capsule({ length: L2, radius:  r });

    var capsuleBody1 = new p2.Body({
        mass: mass,
        position : [x0, h]
    });
    capsuleBody1.addShape(capsuleShape1);

    var capsuleBody2 = new p2.Body({
        mass: mass,
        position : [x0+L1, h]
    });
    capsuleBody2.addShape(capsuleShape2);

    world.addBody(capsuleBody1);
    world.addBody(capsuleBody2);

    var pin0 = new p2.RevoluteConstraint(ground, capsuleBody1, {
        localPivotA: [x0-L1/2.0, h],
        localPivotB: [-L1/2.0, 0],
        collideConnected:false
    });
    var revolute = new p2.RevoluteConstraint(capsuleBody1, capsuleBody2, {
        localPivotA: [L1/2.0, 0],
        localPivotB: [-L2/2.0, 0],
        collideConnected:false
    });
    world.addConstraint(pin0);
    world.addConstraint(revolute);
    //revolute.setMotorSpeed(0);
    //revolute.enableMotor();
    //motor = revolute;
    return [pin0, revolute];
}

function setMotor(pin)
{
    pin.enableMotor();
    pin.setMotorSpeed(0);
    motors.push(pin);
}

/*
Add multiple pendulum with specificed lengths.
*/
function addPend(world, ground, x0, h, mass, lengths, r)
{
    r = r || radius;
    bodies = [];
    pins = [];
    var prevBody = null;
    var prevL;
    var x = x0;
    for (var i=0; i<lengths.length; i++) {
        var L = lengths[i];
        var shape = new p2.Capsule({ length: L, radius:  r });
        var body = new p2.Body({
            mass: mass,
            position : [x+L/2.0, h]
        });
        body.addShape(shape);
        bodies.push(body);
        world.addBody(body);
        var pin;
        if (i == 0) {
            pin = new p2.RevoluteConstraint(ground, body, {
                localPivotA: [x, h],
                localPivotB: [-L/2.0, 0],
                collideConnected:false
            });
        }
        else {
            pin = new p2.RevoluteConstraint(prevBody, body, {
                localPivotA: [prevL/2.0, 0],
                localPivotB: [-L/2.0, 0],
                collideConnected:false
            });
        }
        world.addConstraint(pin);
        pins.push(pin);
        prevBody = body;
        prevL = L;
        x += L;
    }
    //pin.setMotorSpeed(0);
    //pin.enableMotor();
    return pins;
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
                 motor.setMotorSpeed(0);
             });
         });
      });
}

setup();

