
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
    constructor(trainName, sock, portal) {
        var inst = this;
        console.log("TrainControl", sock);
        this.trainName = trainName;
        this.state = null;
        this.proximity = "";
        this.socket = sock;
        this.portal = portal;
        this.t0 = getClockTime();
        this.setState("Init");
        this.queue = new Queue();
        this.THRESHOLD = 100;
        this.proximitySensors = {
            "TUNNEL": "A9"
        };
        this.program = null;
        this.sendMUSE({msgType: 'TrainInit'});
        portal.sock.on("MUSE.IOT", msg => { inst.handleMUSE(msg); });
        this.timer = setInterval(() => this.timerFun(), 1000);
    }

    timerFun() {
        console.log("**** TICK ****");
        this.sendStatus();
    }

    sendStatus() {
        var msg = { msgType: 'train.status',
                    train: this.trainName,
                    location: this.proximity,
                    state: this.state
                  };
        //console.log("sending "+JSON.stringify(msg));
        this.sendMUSE(msg);
    }

    handleMUSE(msg) {
        console.log("handleMUSE", msg);
        if (msg.msgType == 'train.request' && msg.train == this.trainName) {
            console.log("*** handle request "+msg.request);
            if (msg.request == 'Stop')
                this.stop();
            else if (msg.request == 'Forward')
                this.moveForward();
            else if (msg.request == 'Reverse')
                this.moveReverse();
            else {
                console.log("*** unknown request "+msg.request);
            }
        }
    }

    sendMUSE(msg) {
        if (!this.portal) {
            console.log("sendMUSE ... no portal");
            return;
        }
        msg.train = this.trainName;
        this.portal.sendMessage(msg);
    }

    setProgram(program) {
        this.program = program;
    }

    setState(state) {
        if (state != this.state) {
            this.lastTransitionTime = getClockTime();
        }
        this.state = state;
        //this.sendMUSE({msgType: 'train.newState', state: state});
        this.sendStatus();
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
        this.checkStopCondition();
        if (this.program) {
            this.program.update();
        }
        this.updateStatus();
    }

    checkStopCondition() {
        if (this.trainName == "train1") {
            if (this.proximity == "TUNNEL" && this.state == "Forward")
                this.stop();
        }
        else if (this.trainName == "train2") {
            if (this.proximity == "TUNNEL" && this.state == "Reverse")
                this.stop();
        }
        else {
            this.stop();
            warning("Unknown train name "+this.trainName);
        }
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
                this.proximity = location;
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
        //this.sendMUSE({msgType: 'train.proximity', location: location});
        this.sendStatus();
    }

    moveForward() {
        if (this.proximity== "TUNNEL"&& this.trainName== "train1") {
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
        if (this.proximity== "TUNNEL"&& this.trainName== "train2") {
            warning("Cannot move forward at TUNNEL");
            return;
        }
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
