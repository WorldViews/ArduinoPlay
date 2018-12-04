
function getClockTime(){
    return new Date().getTime()/1000;
};

var lpc = null;

// Store frame for motion functions
var previousFrame = null;

// Setup Leap loop with frame callback function
var controllerOptions = {};

// to use HMD mode:
// controllerOptions.optimizeHMD = true;

var paused = false;
var lpc = null;

function dist(x0,y0,x1,y1)
{
    var dx = x1-x0;
    var dy = y1-y0;
    return Math.sqrt(dx*dx+dy*dy);
}

function leapHandleFrame(frame) {
  if (paused) {
    return; // Skip this update
  }
  if (lfc) {
       lfc.handleFrame(frame);
  }
  // Display Frame object data
  var frameOutput = document.getElementById("frameData");
    if (!frameOutput) {
        return;
    }
  var frameString = "Frame ID: " + frame.id  + "<br />"
                  + "Timestamp: " + frame.timestamp + " &micro;s<br />"
                  + "Hands: " + frame.hands.length + "<br />"
                  + "Fingers: " + frame.fingers.length + "<br />";

  frameOutput.innerHTML = "<div style='width:300px; float:left; padding:5px'>" + frameString + "</div>";

  // Display Hand object data
  var handOutput = document.getElementById("handData");
  var handString = "";
  if (frame.hands.length > 0) {
    for (var i = 0; i < frame.hands.length; i++) {
      var hand = frame.hands[i];

      handString += "<div style='width:300px; float:left; padding:5px'>";
      handString += "Hand ID: " + hand.id + "<br />";
      handString += "Type: " + hand.type + " hand" + "<br />";
      handString += "Direction: " + vectorToString(hand.direction, 2) + "<br />";
      handString += "Palm position: " + vectorToString(hand.palmPosition) + " mm<br />";
      handString += "Grab strength: " + hand.grabStrength + "<br />";
      handString += "Pinch strength: " + hand.pinchStrength + "<br />";
      handString += "Confidence: " + hand.confidence + "<br />";
      handString += "Arm direction: " + vectorToString(hand.arm.direction()) + "<br />";
      handString += "Arm center: " + vectorToString(hand.arm.center()) + "<br />";
      handString += "Arm up vector: " + vectorToString(hand.arm.basis[1]) + "<br />";

      // IDs of pointables associated with this hand
      if (hand.pointables.length > 0) {
        var fingerIds = [];
        for (var j = 0; j < hand.pointables.length; j++) {
          var pointable = hand.pointables[j];
            fingerIds.push(pointable.id);
        }
        if (fingerIds.length > 0) {
          handString += "Fingers IDs: " + fingerIds.join(", ") + "<br />";
        }
      }

      handString += "</div>";
    }
  }
  else {
    handString += "No hands";
  }
  handOutput.innerHTML = handString;

  // Display Pointable (finger) object data
  var pointableOutput = document.getElementById("pointableData");
  var pointableString = "";
  if (frame.pointables.length > 0) {
    var fingerTypeMap = ["Thumb", "Index finger", "Middle finger", "Ring finger", "Pinky finger"];
    var boneTypeMap = ["Metacarpal", "Proximal phalanx", "Intermediate phalanx", "Distal phalanx"];
    for (var i = 0; i < frame.pointables.length; i++) {
      var pointable = frame.pointables[i];

      pointableString += "<div style='width:250px; float:left; padding:5px'>";

      {
        pointableString += "Pointable ID: " + pointable.id + "<br />";
        pointableString += "Type: " + fingerTypeMap[pointable.type] + "<br />";
        pointableString += "Belongs to hand with ID: " + pointable.handId + "<br />";
        pointableString += "Classified as a finger<br />";
        pointableString += "Length: " + pointable.length.toFixed(1) + " mm<br />";
        pointableString += "Width: "  + pointable.width.toFixed(1) + " mm<br />";
        pointableString += "Direction: " + vectorToString(pointable.direction, 2) + "<br />";
        pointableString += "Extended?: "  + pointable.extended + "<br />";
        pointable.bones.forEach( function(bone){
          pointableString += boneTypeMap[bone.type] + " bone <br />";
          pointableString += "Center: " + vectorToString(bone.center()) + "<br />";
          pointableString += "Direction: " + vectorToString(bone.direction()) + "<br />";
          pointableString += "Up vector: " + vectorToString(bone.basis[1]) + "<br />";
        });
        pointableString += "Tip position: " + vectorToString(pointable.tipPosition) + " mm<br />";
        pointableString += "</div>";
      }
    }
  }
  else {
    pointableString += "<div>No pointables</div>";
  }
  pointableOutput.innerHTML = pointableString;

  // Store frame for motion functions
  previousFrame = frame;
}

function vectorToString(vector, digits) {
  if (typeof digits === "undefined") {
    digits = 1;
  }
  return "(" + vector[0].toFixed(digits) + ", "
             + vector[1].toFixed(digits) + ", "
             + vector[2].toFixed(digits) + ")";
}

function togglePause() {
  paused = !paused;

  if (paused) {
    document.getElementById("pause").innerText = "Resume";
  } else {
    document.getElementById("pause").innerText = "Pause";
  }
}

class LeapView
{
    constructor(id) {
        id = id || "view";
        this.id = id;
        this.numFrames = 0;
        this.scale = .5;
    }

    update(frame) {
        this.numFrames++;
        var canvas = document.getElementById(this.id);
        if (!canvas)
            return;
        var vw = canvas.width;
        var vh = canvas.height;
        this.x0 = vw/2.0;
        this.y0 = vh/2.0;
        this.ctx = canvas.getContext("2d");
        var t = this.numFrames/60;
        this.ctx.clearRect(0,0,1000,1000);
        this.drawPoint(0,0, 'black');
        for (var i = 0; i < frame.hands.length; i++) {
            var hand = frame.hands[i];
            var pos = hand.palmPosition;
            var x = pos[0];
            var y = pos[2];
            this.drawPoint(x, y, hand.isGood ? 'red' : 'gray');
        }
    }
    
    viewToCanv(x,y) {
        return {x: this.x0+this.scale*x, y: this.y0+this.scale*y};
    }        
    
    drawPoint(x,y,color) {
        var ctx = this.ctx;
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.fillStyle = color;
        var cxy = this.viewToCanv(x,y);
        ctx.arc(cxy.x, cxy.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class LeapFluidControl
{
    constructor() {
        this.frameNum = 0;
        this.prevGrab = false;
        this.prevPinch = false;
	this.lastSwitchTime = 0;
        //this.leapView = new LeapView();
    }

    onGrabEvent(frame, hand, grab) {
        if (grab)
            console.log("***** Grab!!! *****");
        else
            console.log("***** Grab released!!! *****");
	if (this.pinch) {
	    console.log("**** ignoring grab while pinch is active ****");
	    return;
	}
        if (!hand.isGood) {
            return;
        }
	var t = getClockTime();
	var dt = t - this.lastSwitchTime;
	console.log("*********************** dt: "+dt);
    }

    onPinchEvent(frame, hand, pinch) {
        if (pinch) {
            console.log("***** Pinch!!! *****");
            this.pinchStartPos = hand.palmPosition;
            tip[1].enable = true;
            tip[2].enable = true;
        }
        else {
            console.log("***** Pinch released!!! stop fluid dragging *****");
            tip[1].enable = false;
            tip[2].enable = false;
        }
    }

    onPinchMotion(frame, hand) {
        var pos = hand.palmPosition;
        var pos0 = this.pinchStartPos;
        var x = pos[0];
        var y = pos[2];
        var z = pos[1];
        var dx = x - pos0[0];
        var dy = y - pos0[2];
        var dz = z - pos0[1];
        console.log("x: "+x+"  y: "+y+"   z: "+z);
        console.log("dx: "+dx+"  dy: "+dy+"   dz: "+dz);
        move(tip[2], x+200, y+200);
    }
    
    handleFrame(frame) {
        //console.log("handleFrame", frame);
        this.frameNum++;
        var str = "frameNum: "+this.frameNum+"<br>\n";
        for (var i = 0; i < frame.hands.length; i++) {
            var hand = frame.hands[i];
            var hpos = hand.palmPosition;
            var hx = hpos[0];
            var hy = hpos[2];
            var hd = dist(hx,hy,0,0);
            hand.isGood = hd < 120;
            this.grab = hand.grabStrength > .8;
            this.pinch = hand.pinchStrength > .7;
            str += "Grab: "+ this.grab;
            str += "<br>\n";
            str += "Pinch: " + this.pinch;
            str += "<br>\n";
            /*
            handString += "<div style='width:300px; float:left; padding:5px'>";
            handString += "Hand ID: " + hand.id + "<br />";
            handString += "Type: " + hand.type + " hand" + "<br />";
            handString += "Direction: " + vectorToString(hand.direction, 2) + "<br />";
            handString += "Palm position: " + vectorToString(hand.palmPosition) + " mm<br />";
            handString += "Grab strength: " + hand.grabStrength + "<br />";
            handString += "Pinch strength: " + hand.pinchStrength + "<br />";
            handString += "Confidence: " + hand.confidence + "<br />";
            handString += "Arm direction: " + vectorToString(hand.arm.direction()) + "<br />";
            */
            if (this.grab != this.prevGrab) {
                this.onGrabEvent(frame, hand, this.grab);
                this.prevGrab = this.grab;
            }
            if (this.pinch != this.prevPinch) {
                this.onPinchEvent(frame, hand, this.pinch);
                this.prevPinch = this.pinch;
            }
            if (this.pinch)
                this.onPinchMotion(frame, hand);
        }
        $("#portalControl").html(str);
        if (this.leapView)
            this.leapView.update(frame);
    }
}




