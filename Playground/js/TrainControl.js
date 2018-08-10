
var TUNNEL = "TUNNEL";
var program = true;

function getClockTime(){
    return new Date().getTime()/1000;
};

function warning(str) {
    console.log(str);
    alert(str);
}

/*
class Program {
    constructor(train) {
        this.train = train;
        this.state = "STARTING";
    }

    update() {
        if (this.state
    }
}
*/

class TrainControl {
    constructor(sock) {
        console.log("TrainControl", sock);
        this.proximity = "";
        this.socket = sock;
        this.t0 = getClockTime();
        this.setState("Init");
    }

    setState(state) {
        if (state != this.state) {
            this.lastTransitionTime = getClockTime();
        }
        this.state = state;
    }

    updateStatus() {
        var dt = getClockTime() - this.lastTransitionTime;
        var status = sprintf("%s %.1f %s",
                             this.state, dt, this.proximity);
        $("#trainState").html(status);
    }
    
    observeSensor(val){
        //console.log("observeVal "+val);
        if(val>100){
            this.proximity = "TUNNEL";
            if (this.state == "Forward")
                this.stop();
        }
        else {
            if (this.proximity == TUNNEL && this.state != "Reverse") {
                // bounce condition.  We were in tunnel, and did not
                // move backwards, so we must be in bounce condition
                // and will keep proximity TUNNEL.
            }
            else {
                this.proximity = "";
            }
        }
        if (program) {
//            this.handleProgram();
        }
        this.updateStatus();
    }

    handleProgram() {
        var dt = getClockTime() - this.lastTransitionTime;
        if (this.proximity == "TUNNEL" && this.state == "Stopped" && dt > 4) {
            this.moveReverse();
            return;
        }
        if (this.state == "Reverse" && dt > 1) {
            this.moveForward();
        }
    }

    moveForward() {
        if (this.proximity == "TUNNEL") {
            warning("Cannot move forward at TUNNEL");
            return;
        }
        console.log("Train Forward");
        var msg = [{pin: 2, value: 'high'},
                   {pin: 3, value: 'high'},
                   {pin: 6, value: 'low'}];
        this.socket.emit("pins.set", msg);
        this.setState("Forward");
    }

    moveReverse() {
        console.log("Train Reverse");
        this.setState("Reverse");
        var msg = [{pin: 2, value: 'high'},
                   {pin: 3, value: 'low'},
                   {pin: 6, value: 'high'}];
        this.socket.emit("pins.set", msg);
    }

    stop(){
        console.log("Train Stop");
        var msg = [{pin: 2, value: 'low'}];
        this.socket.emit("pins.set", msg);
        this.setState("Stopped");
    };

    
};
