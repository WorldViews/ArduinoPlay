

function getClockTime(){
    return new Date().getTime()/1000;
};

class Teleporter {
    constructor(sock) {
        this.socket = sock;
        this.t0 = getClockTime();
        this.closeGate();
    }

    observeSensor(val){
        //console.log("sensor  val: "+ val)
        //console.log("runtime:"+dt);
        var t = getClockTime();
        if(val>30){
            this.tObserve = getClockTime();
        };
        if (this.tObserve != null){
            var dt = t - this.tObserve;
            if (dt > 2){
                console.log("foo");
                this.openGate();
            };
        }
        if (dt > 3){
            this.closeGate();
        };
    }

    openGate(){
        this.socket.emit("servo.set",0);
        //tObserve=null;
    };

    closeGate(){
        this.socket.emit("servo.set",180);
        this.tObserve=null;
    };
};
