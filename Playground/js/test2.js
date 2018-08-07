
var argv = process.argv;
var port = "3000";
var SerialPort = require("serialport");
var comPortPath = "com3";
var comPort = null;

console.log("***** Running test2.js ****");
console.log("argv:", argv);
if (argv.length > 2)
    comPortPath = argv[2];
if (argv.length > 3)
    port = argv[3];


console.log("Using com port: "+comPortPath);
var Playground = require("playground-io");
var five = require("johnny-five");

var board = null;
var pins = {
    "A9": null,
    2: null,
    3: null,
    10: null,
};

//////////////////////////////////////////////////////////////////
// Board stuff


function setupBoard(comPortPath) {
    console.log("Getting SerialPort for "+comPortPath);
    comPort = new SerialPort(comPortPath,
                             (err) => {
                                 console.log("got callback: "+err);
                                 setupInProgress = false;
                             },
                             (err) => {
                                 console.log("got error callback: "+err);
                                 setupInProgress = false;
                             });

    console.log("getting five.Board");
    board = new five.Board({
        io: new Playground({
            port: comPort,

            // Passing Firmata options through:
            // Circuit Playground Firmata seems not to report version before timeout,
            // lower timeout to reduce initial connection time.
            reportVersionTimeout: 200
        })
    });

    board.on("ready", function() {
        console.log("**** board ready - ****");

        console.log("Getting led pin 13 for this board");
        led = new five.Led({pin: 13, board: board});
        console.log("Getting servo for this board");
        servo = new five.Servo({pin: 12, board: board});
        /*
        for (var pinName in pins) {
            var pin = new five.Pin({pin: pinName, board: board});
            pins[pinName] = pin;
        }
        */
        //pin6 = new five.Pin({pin: "A6", board: board});
        pin2 = new five.Pin({pin: 2, board: board});
        pin3 = new five.Pin({pin: 3, board: board});
        pin6 = new five.Pin({pin: 6, board: board});
        pin9 = new five.Pin({pin: "A9", board: board});

        pin6.on("data", (data) => {
            console.log("pin6 "+data);
        });

        pin9.on("data", (data) => {
            console.log("pin9 "+data);
        });

        board.on("exit", () => {
            console.log("Board exit...");
        });

        board.on("fail", () => {
            console.log("Board failed...");
        });
    })
}


var tickCount = 0;

function heartbeat() {
    tickCount++;
    var status = (comPort && comPort.isOpen) ? "open" : "closed";
    console.log("tick... "+tickCount+" "+comPortPath+" "+status);
    if (tickCount % 2 == 0) {
        console.log("pin6 high");
        pin2.high();
        pin3.high();
        pin6.high();
    }
    else {
        console.log("pin6 low");
        pin2.low();
        pin3.low();
        pin6.low();
    }
}

function heartbeat() {
    tickCount++;
    var status = (comPort && comPort.isOpen) ? "open" : "closed";
    console.log("tick... "+tickCount+" "+comPortPath+" "+status);
    if (tickCount % 2 == 0) {
        console.log("pin6 high");
        pin2.high();
        pin6.high();
    }
    else {
        console.log("pin6 low");
        pin2.low();
        pin6.low();
    }
}

var tc3 = 0;
function tweak3() {
    tc3++;
    console.log("tweak3... "+tc3);
    if (tc3 % 2 == 0) {
        console.log("pin3 high");
        pin3.high();
    }
    else {
        console.log("pin3 low");
        pin3.low();
    }
}

setupBoard(comPortPath);

setInterval(heartbeat, 2000);
setInterval(tweak3, 500);
