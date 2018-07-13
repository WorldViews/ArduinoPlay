
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

class KineticGame {
    constructor(comp1Name, comp1Server) {
	console.log("******** setting up KinectiGame ******");
        //this.comp1 = new KineticComponent(comp1Name, comp1Server);
        //this.comp1 = new KineticComponent("comp1", "192.168.22.203:3000");
	this.comp1 = new KineticComponent(comp1Name, "hw0974:3000");
        //this.comp2 = new KineticComponent(comp1Name, "192.168.22.203:3000");
	//this.comp2 = new KineticComponent("comp2", "localhost:3000");
        this.comp2 = new KineticComponent("comp2", "192.168.22.203:3000");
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
        this.comp1.setServo(sval);
        this.comp2.setServo(sval);
    }
}

