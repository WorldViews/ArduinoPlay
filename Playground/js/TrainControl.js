
var TUNNEL = "TUNNEL";

function getClockTime(){
    return new Date().getTime()/1000;
};

function warning(str) {
    console.log(str);
    alert(str);
}

// This keeps track of last maxNum values seen.
// It can return the last N value seen.  This is useful
// for debouncing sensor values, and for debugging.
class Queue {
    constructor(maxNum) {
        this.vals = [];
        this.maxNum = maxNum || 20;
        this.i = 0;
    }

    push(val) {
        this.vals[this.i++ % this.maxNum] = val;
    }

    lastN(N) {
        N = N || this.maxNum;
        var vec = [];
        for (var j=0; j<N; j++) {
            var k = (this.i-1) - j;
            if (k < 0)
                break;
            vec.push(this.vals[k % this.maxNum]);
        }
        return vec;
    }

    dump() {
        var vec = this.lastN();
        console.log("queue vals: "+JSON.stringify(vec));
    }
}


class TrainControl {
    constructor(sock) {
        console.log("TrainControl", sock);
        this.proximity = "";
        this.socket = sock;
        this.t0 = getClockTime();
        this.setState("Init");
        this.queue = new Queue();
        this.THRESHOLD = 100;
        this.proximitySensors = {
            "TUNNEL": "A9"
        };
        this.program = null;
    }

    setProgram(program) {
        this.program = program;
    }
    
    setState(state) {
        if (state != this.state) {
            this.lastTransitionTime = getClockTime();
        }
        this.state = state;
    }

    updateStatus() {
        var dt = getClockTime() - this.lastTransitionTime;
        var status = sprintf("%s %.1f %s<br>",
                             this.state, dt, this.proximity);
        if (this.program)
            status += "Program: " + this.program.status();
        else
            status += "&nbsp;";
        $("#trainState").html(status);
    }

    observe(msg) {
        var PS = this.proximitySensors;
        for (var location in PS) {
            var pin = PS[location];
            if (msg.pin == pin)
                train.observeProximitySensor(location, msg.data);
        }
        if (this.proximity == "TUNNEL" && this.state == "Forward")
            this.stop();
        if (this.program) {
            this.program.update();
        }
        this.updateStatus();
    }

    observeProximitySensor(location, val){
        //console.log("observeVal "+val);
        this.queue.push(val);
        //this.queue.dump();
        var N = 3;
        var lastN = this.queue.lastN(N);
        var prox = true;
        for (var i=0; i<N; i++) {
            if (lastN[i] < this.THRESHOLD) {
                prox = false;
                break;
            }
        }
        if(prox) {
            //console.log("Detected Proximity "+location);
            if (location != this.proximity) {
                this.newProximity(location);
            }
            this.proximity = location;
        }
        else {
            this.proximity = "";
        }
    }

    newProximity(location) {
        console.log("New Proximity "+location);
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
}

class TrainProgram {
    constructor(train, name) {
        this.name = name || "Tunnel Looper";
        this.train = train;
        this.programState = "INIT";
    }

    status() {
        return sprintf("%s %s", this.name, this.programState);
    }
    
    update() {
        var train = this.train;
        var dt = getClockTime() - train.lastTransitionTime;
        console.log(sprintf("TrainProgram update proximity: %s state: %s  dt: %.1f",
                            train.proximity, train.state, dt));
        if (train.proximity == "TUNNEL" && train.state == "Stopped" && dt > 4) {
            train.moveReverse();
            this.programState = "REVERSE";
            return;
        }
        else if (this.programState == "INIT") {
            train.moveForward();
            this.programState = "FORWARD";
        }
        else if (this.programState == "REVERSE" && train.state == "Reverse" && dt > 2.0) {
            train.stop();
            this.programState = "PAUSING";
        }
        else if (this.programState == "PAUSING" && train.state == "Stopped" && dt > 6.0) {
            train.moveForward();
            this.programState = "FORWARD";
        }
    }
}
