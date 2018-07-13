
var COMP_URL = "platonia:3000";

class KineticComponent {
    constructor(compName, compServer) {
        compServer = compServer || COMP_URL;
        console.log("comp server:", compServer);
        $("#comp1Server").html(compServer);
        this.sock = io(compServer);
        this.sock.on('status', msg=> {
            console.log("status "+JSON.stringify(msg));
            $("#comp1Status").html(JSON.stringify(msg));
        });
    }

    setServo(val) {
        console.log("setServo "+val);
        this.sock.emit("servo.set", val);
    }

}

class RobotGame {
    constructor(comp1Name, comp1Server) {
	console.log("******** setting up KinectiGame ******");
		
		 this.cmdVel = new ROSLIB.Topic({
		    ros : ros,
		    name : '/hand_pos',
		    messageType : 'geometry_msgs/Twist'
		  });

    }
	

    handleHand(body, jname) {
        var pos = body.msg[jname];
        console.log("pos: "+pos);
        var x = pos[0];
        var fx = x/1000;
        var sx = 90 + 220*fx;
        console.log("fx: "+fx+"  sx: "+sx);
        this.setServo(sx);
        setMark("kin", sx, 40, "blue");
		
	}
    
    handleKinUpdate(kinWatch) {
        for (var bodyId in kinWatch.bodies) {
            var body = kinWatch.bodies[bodyId];
            //console.log("body: "+body);
            if (body.RIGHT_UP.getState()) {
                this.handleHand(body, "RIGHT_HAND");
            }
            if (body.LEFT_UP.getState()) {
                this.handleHand(body, "LEFT_HAND");
            }
        }
    }

    setServo(sval) {
      
		/*
		console.log('ros: ',ros);
		var cmdVel = new ROSLIB.Topic({
		    ros : ros,
		    name : '/hand_pos',
		    messageType : 'geometry_msgs/Twist'
		  });*/

		  var twist = new ROSLIB.Message({
		    linear : {
		      x : sval,
		      y : 0.0,
		      z : 0.0
		    },
		    angular : {
		      x : -0.1,
		      y : -0.2,
		      z : -0.3
		    }
		  });
		  this.cmdVel.publish(twist);
    }
}

