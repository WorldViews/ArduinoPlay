
var COMP_URL = "platonia:3000";

class KineticComponent {
    constructor(compName, compServer) {
        compServer = comp1Server || COMP_URL;
        console.log("comp1 server:", compServer);
        $("#comp1Server").html(comp1Server);
        this.sock = io(comp1Server);
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
        this.comp1 = new KineticComponent(comp1Name, comp1Server);
        this.comp2 = new KineticComponent(comp1Name, "platonia:3000");
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

