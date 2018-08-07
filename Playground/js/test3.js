
var argv = process.argv;
var port = "3000";
//var port = 8089;
var addr = "0.0.0.0";
var SerialPort = require("serialport");
var comPortPath = "com3";
var comPort = null;

console.log("***** Running server2.js ****");
console.log("argv:", argv);
if (argv.length > 2)
    comPortPath = argv[2];
if (argv.length > 3)
    port = argv[3];


console.log("Using com port: "+comPortPath);
var Playground = require("playground-io");
var five = require("johnny-five");
var sock = null;
var activeSockets = [];
var pin9 = null;
var light = null;
var led = null;
var servo = null;
//var board = new five.Board();
var board = null;
var pins = {
    "A6": null,
    "A9": null,
};

var http = require("http");
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var server = http.createServer(app);

/////////////////////////////////////////////////
// web handling stuff...

app.use(express.static(__dirname + "/.."));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/playBox", function (req, res) {
    var str = __dirname + "/playBox.html"
    res.sendFile(str);
});

app.get("/realtime", function (req, res) {
  res.sendFile(__dirname + "/realtime.html");
});

app.get("/*", function (req, res) {
    console.log("*** "+req.path);
    res.sendFile(__dirname + req.path);
});


//////////////////////////////////////////////////////////////////
// Board stuff

var setupInProgress = false;

function setupBoard(comPortPath) {
    setupInProgress = true;
    //var comPort = "com4";
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

    if (!setupInProgress) {
        console.log("Failed to get board...");
        return;
    }
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

    function setPin(pin, name) {
        var label = name;
        pin.on("data", (data) => {
            console.log("pin "+label+" "+data);
        });
    }
    
    board.on("ready", function() {
        console.log("**** board ready - ****");
        setupInProgress = false;
        if (!comPort.isOpen) {
            console.log("aborting board initialization - com port not open");
            return;
        }
        console.log("Getting led pin 13 for this board");
        led = new five.Led({pin: 13, board: board});
        console.log("Getting servo for this board");
        servo = new five.Servo({pin: 12, board: board});
        for (var pinName in pins) {
            console.log("creating pin "+pinName);
            var pin = new five.Pin({pin: pinName, board: board});
            pins[pinName] = pin;
            setPin(pin, pinName);
//            pin.on("data", (data) => {
//                console.log("pin "+pinName+" "+data);
//            });
        }
/*
        pin6 = new five.Pin({pin: "A6", board: board});
        pin9 = new five.Pin({pin: "A9", board: board});
*/
//        setPin(pin6, "pin6");
//        setPin(pin9, "pin9");
        /*
        var label = "pin6";
        pin6.on("data", (data) => {
            console.log("pin6 "+label+" "+data);
        });
        var label = "pin9";
        pin9.on("data", (data) => {
            console.log("pin9 "+label+" "+data);
        });
        */
        light = new five.Light({pin: 5, type: "analog", board: board});
        led.blink(1000);
        //console.log("Pin:", pin);
    
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
    if (!(comPort && comPort.isOpen)) {
        if (setupInProgress)
            console.log("*** retrying ***");
        else {
            setupBoard(comPortPath);
        }
    }
}


setupBoard(comPortPath);

setInterval(heartbeat, 2000);
