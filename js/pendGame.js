
var speed = 5;
var ASCII = {};
ASCII.A = 65;
ASCII.S = 83;
var MASS = 0.2;
var x0 = 2;
var L1 = 0.25;
var L2 = 1;
var motor = null;
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
        position : [0, -2]
    });
    plane.addShape(planeShape);
    world.addBody(plane);

    // Create capsules connected with angular spring
    var capsuleShape1 = new p2.Capsule({ length: L1, radius:  0.1 });
    var capsuleShape2 = new p2.Capsule({ length: L2, radius:  0.1 });

    var capsuleBody1 = new p2.Body({
        mass: MASS,
        position : [x0, 1]
    });
    capsuleBody1.addShape(capsuleShape1);

    var capsuleBody2 = new p2.Body({
        mass: MASS,
        position : [x0+L1, 1]
    });
    capsuleBody2.addShape(capsuleShape2);

    world.addBody(capsuleBody1);
    world.addBody(capsuleBody2);

    var pin0 = new p2.RevoluteConstraint(plane, capsuleBody1, {
        localPivotA: [x0-L1/2.0, 2.5],
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
    revolute.setMotorSpeed(10);
    revolute.enableMotor();
    motor = revolute;

    this.frame(3,0,8,8);
}

function setupKeys() {
      $(document).ready(function() {
         console.log("**** document.ready");
         $(document).keydown(function(e) {
             console.log("**** keydown "+e.which);
             if (e.which == ASCII.A) {
                console.log("*** a ****");
                motor.setMotorSpeed(speed);
             }
             else if (e.which == ASCII.S) {
                console.log("*** b ****");
                motor.setMotorSpeed(-speed);
             }
         });
         $(document).keyup(function(e) {
             console.log("**** keyup "+e.which);
             motor.setMotorSpeed(0);
         });
      });
}

setup();

