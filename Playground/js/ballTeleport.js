

var socket=null;
var t0;
function initTeleporter(sock){
    socket=sock;
    t0=getClockTime();
};

function getClockTime(){
    return new Date().getTime()/1000;
}

function observeSensor(val){
    //console.log("sensor  val: "+ val)
    var t= getClockTime();
    var dt = t-t0;
    console.log("runtime:"+dt);
    if(val>30){
        console.log("foo");
        openGate();
    }
}

function openGate(){
    socket.emit("servo.set",0)
}

function closeGate(){
    socket.emit("servo.set",120)
}
