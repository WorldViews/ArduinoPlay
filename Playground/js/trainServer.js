'use strict';

var MUSE = require("./MUSEDefs.js").MUSE;
var Harness = require("./MUSEArduino.js").Harness;
const five = require('johnny-five');
const Playground = require("playground-io");

var portal = MUSE.getPortal();
console.log("MUSE server "+portal.server);


var TUNNEL = "TUNNEL";

function getClockTime(){
    return new Date().getTime()/1000;
};

function warning(str) {
    console.log(str);
}

// This keeps track of last maxNum values seen.
// It can return the last N value seen.  This is useful
// for debouncing sensor values, and for debugging.
class Queue {
    constructor(maxNum) {
        this.vals = [];
        this.maxNum = maxNum || 80;
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


var board = null;
var led = null;
var servo = null;
var light = null;
var pin0, pin2, pin3, pin6;

class TrainServer {
    constructor(name, portal) {
        console.log("TrainServer "+name);
        let inst = this;
        this.trainName = name;
        this.portal = portal;
        this.programState = "S1";
        this.portal = portal;
        this.channel = "MUSE.IOT";

        this.t0 = getClockTime();
        this.setState("Init");
        this.queue = new Queue();
        //this.THRESHOLD = 100;
        this.THRESHOLD = 0.5;
        this.proximitySensors = {
            //"TUNNEL": "A9"
            "TUNNEL": 0
        };
        this.program = null;
        
        portal.sock.on(this.channel, msg => {
            inst.handleMessage(msg);
            //inst.updateProgram();
        });
    }

    sendMessage(msg)
    {
        this.portal.sendMessage(msg, this.channel);
    }
    
    handleMessage(msg) {
        if (msg.msgType == "train.status")
            return;
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

    setState(state) {
        if (state != this.state) {
            this.lastTransitionTime = getClockTime();
        }
        this.state = state;
        this.sendStatus();
    }

    stop()
    {
        console.log("stop");
        pin2.write(0);
        this.setState("Stopped");
    }

    moveForward()
    {
        console.log("forward");
        if (this.proximity== "TUNNEL"&& this.trainName== "train1") {
            warning("********* Cannot move forward at TUNNEL *********");
            return;
        }
        console.log("Train Forward");
        pin2.write(1);
        pin3.write(1);
        pin6.write(0);
        this.setState("Forward");
    }

    moveReverse()
    {
        console.log("reverse");
        if (this.proximity== "TUNNEL"&& this.trainName== "train2") {
            warning("Cannot move forward at TUNNEL");
            return;
        }
        console.log("Train Reverse");
        this.setState("Reverse");
        pin2.write(1);
        pin3.write(0);
        pin6.write(1);
    }
    
    onBoardReady(board) {
        console.log("**** board ready - ****");
        let inst = this;
        //console.log(board);
        //console.log("comPort:", comPort);
        console.log("Getting led pin 13 for this board");
        led = new five.Led({pin: 13, board: board});
        light = new five.Light({pin: 5, type: "analog", board: board});
        led.blink(1000);
//        board.pinMode(0, five.Pin.INPUT);
//        board.pinMode(2, five.Pin.INPUT);
//        board.pinMode(3, five.Pin.INPUT);
//        board.pinMode(6, five.Pin.INPUT);
        pin0 = new five.Pin(0);
        pin2 = new five.Pin(2);
        pin3 = new five.Pin(3);
        pin6 = new five.Pin(6);

        light.on("change", (data) => {
            //console.log("light: "+JSON.stringify(data));
        });
        five.Pin.read(pin0, (err, val) => {
            //console.log("*** pin0 val: "+val);
            inst.observeProximitySensor("TUNNEL", val);
            inst.checkStopCondition();
            if (inst.program) {
                inst.program.update();
            }
            inst.updateStatus();
        });
    }

    observeProximitySensor(location, val){
        //console.log("observeVal "+val);
        this.queue.push(val);
        //this.queue.dump();
        var N = 2;
        var lastN = this.queue.lastN(N);
        var prox = true;
        for (var i=0; i<N; i++) {
            if (lastN[i] < this.THRESHOLD) {
                prox = false;
                break;
            }
        }
        if (!prox) {
            location = "";
        }
        if (location != this.proximity) {
            this.proximity = location;
            this.newProximity(location);
        }
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

    newProximity(location) {
        console.log("New Proximity "+location);
        this.sendStatus();
    }

    sendStatus() {
        var msg = { msgType: 'train.status',
                    train: this.trainName,
                    location: this.proximity,
                    state: this.state
                  };
        //console.log("sending "+JSON.stringify(msg));
        this.sendMessage(msg);
    }

    updateStatus() {
    }
    
}

var trainName = "train1";
var comPortPath = "com3";

var argv = process.argv;
console.log("argv:", argv);
if (argv.length > 2)
    trainName = argv[2];
if (argv.length > 3)
    comPortPath = argv[3];
console.log("-----------------------------");
console.log("train: "+trainName);
var ts = new TrainServer(trainName, portal);
var harness = new Harness({
    onBoardReady: (board) => ts.onBoardReady(board),
    comPortPath: comPortPath
});
harness.start();
