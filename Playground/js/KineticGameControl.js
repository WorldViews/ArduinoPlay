
var KINETIC_GAME_URL = "platonia:3000";

class KineticGame {
    constructor(server) {
        server = server || KINETIC_GAME_URL;
        $("#gameServer").html(server);
        this.sock = io(server);
        this.sock.on('status', msg=> {
            console.log("status "+JSON.stringify(msg));
            $("#gameStatus").html(JSON.stringify(msg));
        });
    }

    setServo(val) {
        console.log("setServo "+val);
        this.sock.emit("servo.set", val);
    }

    handleKinUpdate(kinWatch) {
        for (var bodyId in kinWatch.bodies) {
            var body = kinWatch.bodies[bodyId];
            //console.log("body: "+body);
            var up = body.RIGHT_UP.getState();
            if (up) {
                var pos = body.msg['RIGHT_HAND'];
                console.log("pos: "+pos);
                var x = pos[0];
                var fx = x/1000;
                var sx = 90 + 220*fx;
                console.log("fx: "+fx+"  sx: "+sx);
                this.setServo(sx);
            }
        }
    }
}
