

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
}

var socket=null;
var t0;
var tObserve=null;
var t;
function initTeleporter(sock){
    socket=sock;
    t0=getClockTime();
    closeGate();
};

function observeSensor(val){
    //console.log("sensor  val: "+ val)
    //console.log("runtime:"+dt);
    t=getClockTime();
    if(val>30){
        tObserve= getClockTime();
    };
    if (tObserve != null){
        var dt = t-tObserve;
        if (dt > 2){
            console.log("foo");
            openGate();
        };
    }
    if (dt > 3){
        closeGate();
    };
};

function openGate(){
    socket.emit("servo.set",0);
    //tObserve=null;
};

function closeGate(){
    socket.emit("servo.set",180);
    tObserve=null;
};
