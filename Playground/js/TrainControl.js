

function getClockTime(){
    return new Date().getTime()/1000;
};

function warning(str) {
    console.log(str);
    alert(str);
}

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
        var dt = getClockTime() - this.lastTransitionTime;
        this.state = state;
        var status = sprintf("%s %.1f %s",
                             this.state, dt, this.proximity);
        $("#trainState").html(status);
    }
    
    observeSensor(val){
        //console.log("observeVal "+val);
        this.proximity = "";
        if(val>30){
            this.proximity = "TUNNEL";
            if (this.state == "Forward")
                this.stop();
        };
    }

    moveForward() {
        if (this.proxmity == "TUNNEL") {
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
