
var argv = process.argv;
var port = "3000";
//var port = 8089;
var addr = "0.0.0.0";
//var SerialPort = require("serialport");
var comPortPath = "com3";
var comPort = null;

/*
// This next bit of code is attempt to find the device ID
// (i.e. which unique arduino board we are talking to.)
// unfortunatley it only finds a plug-n-play id that is not
// unique to the device.  Maybe this needs to come from an
// id burned into the firmware.
//
var deviceId = null;
var deviceName = null;

var DEVICES = {
    "USB\\VID_239A&PID_8011&MI_00\\6&31E90419&0&0000": "Train 1",
};

function findDevice() {
    SerialPort.list((err,results) => {
        if (err) {
            console.log("**** Unable list list ports");
            return;
        }
        console.log("------------------------------");
        console.log("COM Ports:");
        results.forEach(spec => {
            console.log(spec);
            var comName = spec.comName;
            if (comName.toLowerCase() == comPortPath.toLowerCase()) {
                deviceId = spec.pnpId;
                deviceName = DEVICES[deviceId];
            }
        });
        console.log("*** deviceId: "+deviceId);
        console.log("*** deviceName: "+deviceName);
        console.log("------------------------------");
    });
}
*/

function csvEncode(obj) {
    var str = "";
    for (var key in obj) {
        if (str != "")
            str += ", ";
        str += (key + ", " + obj[key]);
    }
    return str + "\n";
}

console.log("***** Running server2.js ****");
console.log("argv:", argv);
if (argv.length > 2)
    comPortPath = argv[2];
if (argv.length > 3)
    port = argv[3];


console.log("Using com port: " + comPortPath);
//var Playground = require("playground-io");
var five = require("johnny-five");
var fs = require('fs');
var sock = null;
var activeSockets = [];
var light = null;
var led = null;
var servo = null;
//var board = new five.Board();
var board = null;
var pins = {
    0: null,
    1: null,
    2: null,
    3: null,
    6: null,
    10: null,
    11: null,
    "A9": null,
};

var pinModes = {
    0: five.Pin.INPUT,
    1: five.Pin.INPUT,
    10: five.Pin.INPUT,
    11: five.Pin.INPUT,
}

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

app.get("/logEvent", function (req, res) {
    var q = req.query;
    console.log("event: " + q);
    var str = csvEncode(q);
    fs.appendFile("eventLog.txt", str, encoding = 'utf8', err => {
        if (err)
            console.log("Err appending to file", err);
    });
    res.end("ok");
});

app.get("/*", function (req, res) {
    console.log("*** " + req.path);
    res.sendFile(__dirname + req.path);
});


//////////////////////////////////////////////////////////////////
// Board stuff

var setupInProgress = false;


function setupPin(pin, pinName) {
    pin.on("data", (data) => {
        //console.log("pin "+pinName+" "+data);
        if (pin != pins[pinName]) {
            //console.log("ignore old pin...");
            return;
        }
        sendMessage("pin.change", data);
        sendMessage("pin.data", { pin: pinName, data: data });
    });
    pin.on("high", (data) => {
        //console.log("pin "+pinName+" "+data);
        if (pin != pins[pinName]) {
            //console.log("ignore old pin...");
            return;
        }
        //sendMessage("pin.data", {pin: pinName, data: "high"});
        sendMessage("pin.data", { pin: pinName, data: 1 });
    });
    pin.on("low", (data) => {
        //console.log("pin "+pinName+" "+data);
        if (pin != pins[pinName]) {
            //console.log("ignore old pin...");
            return;
        }
        //sendMessage("pin.data", {pin: pinName, data: "low"});
        sendMessage("pin.data", { pin: pinName, data: 0 });
    });
}

function setPin(pinName, value) {
    console.log("set pin " + pinName + " " + value);
    var pin = pins[pinName];
    if (!pin) {
        console.log("No such pin as " + pinName);
        return;
    }
    if (value == "low")
        pin.low();
    else if (value == "high")
        pin.high();
    else
        five.Pin.write(pin, value);
    //    five.Pin.read(pin, val => {
    //        console.log("pin "+pinName+" has value "+val);
    //    });
}

function setupPiezo(board) {
    // Creates a piezo object and defines the pin to be used for the signal
    console.log("Setup Piezo");
    var piezo = new five.Piezo("A0sss");

    // Injects the piezo into the repl
    board.repl.inject({
        piezo: piezo
    });

    // Plays a song
    console.log("play song");
    piezo.play({
        // song is composed by an array of pairs of notes and beats
        // The first argument is the note (null means "no note")
        // The second argument is the length of time (beat) of the note (or non-note)
        song: [
            ["C4", 1 / 4],
            ["D4", 1 / 4],
            ["F4", 1 / 4],
            ["D4", 1 / 4],
            ["A4", 1 / 4],
            [null, 1 / 4],
            ["A4", 1],
            ["G4", 1],
            [null, 1 / 2],
            ["C4", 1 / 4],
            ["D4", 1 / 4],
            ["F4", 1 / 4],
            ["D4", 1 / 4],
            ["G4", 1 / 4],
            [null, 1 / 4],
            ["G4", 1],
            ["F4", 1],
            [null, 1 / 2]
        ],
        tempo: 100
    });
    // Plays the same song with a string representation
    /*
    piezo.play({
        // song is composed by a string of notes
        // a default beat is set, and the default octave is used
        // any invalid note is read as "no note"
        song: "C D F D A - A A A A G G G G - - C D F D G - G G G G F F F F - -",
        beats: 1 / 4,
        tempo: 100
    });
    */
   console.log("done with setupPizeo");
}

function setupBoard(comPortPath) {
    setupInProgress = true;
    //var comPort = "com4";
    console.log("Getting five.Board for " + comPortPath);
    board = new five.Board({ port: comPortPath });
    var io = board.io;
    comPort = io.transport;
    console.log("board:", board);
    board.on("ready", function () {
        console.log("**** board ready - ****");
        //console.log(board);
        //console.log("comPort:", comPort);
        setupInProgress = false;
        if (!board.isConnected) {
            console.log("aborting board initialization - com port not open");
            return;
        }
        console.log("Getting led pin 13 for this board");
        led = new five.Led({ pin: 13, board: board });
        console.log("Getting servo for this board");
        servo = new five.Servo({ pin: 12, board: board });
        for (var pinName in pins) {
            console.log("Creating pin " + pinName);
            var pin = new five.Pin({
                pin: pinName,
                mode: pinModes[pinName],
                board: board
            });
            pins[pinName] = pin;
            setupPin(pin, pinName);
        }
        led.blink(500);
        light = new five.Light({ pin: 5, type: "analog", board: board });
        //console.log("Pin:", pin);
        console.log("Got light...");
        if (light) {
            light.on("change", (data) => {
                //console.log("light: "+JSON.stringify(data));
                console.log("lux:", data.lux);
                sendMessage("light.change", data);
            });
        }

        setupPiezo(board);
        /*
        var accelerometer = new five.Accelerometer({
            // controller: Playground.Accelerometer,
            pins: ["A0", "A1"],
            controller: "LIS3DH",
            board: board
        });

        accelerometer.on("change", (data) => {
            console.log("sending acc.change " + data.x + " " + data.y + " " + data.z);
            var acc = { x: data.x, y: data.y, z: data.z };
            //sock.emit("acc.change", data.x+" "+data.y+" "+data.z);
            sendMessage("acc.change", acc);
        });
        */
       
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
    console.log("tick... " + tickCount + " " + port + " " + comPortPath + " " + status);
    if (sock) {
        msg = {
            type: 'status', portPath: comPortPath,
            //deviceId: deviceId,
            //deviceName: deviceName,
            gen: tickCount, haveBoard: false
        };
        var pin = pins["A9"];
        if (pin && comPort && comPort.isOpen)
            msg.haveBoard = true;
        //console.log("sending "+JSON.stringify(msg));
        sendMessage("status", msg);
    }
    if (!(comPort && comPort.isOpen)) {
        if (setupInProgress)
            console.log("*** retrying ***");
        else {
            if (board != null) {
                console.log("****** shutting down board ******");
            }
            setupBoard(comPortPath);
        }
    }
}

function sendMessage(mtype, msg) {
    //console.log("send "+mtype+" "+JSON.stringify(msg));
    activeSockets.forEach(sock => {
        sock.emit(mtype, msg);
    });
}

function handleDisconnect(socket) {
    console.log("handleDisconnect: ", socket);
    var index = activeSockets.indexOf(socket);
    if (index >= 0) {
        activeSockets.splice(index, 1);
    }
    console.log("activeSockets " + activeSockets.length);
}

function setPins(msg) {
    console.log("setPins: ", msg);
    var ops = msg;
    ops.forEach(op => {
        var pinName = op.pin;
        var value = op.value;
        setPin(pinName, value);
    });
}

function showState(pinName, state) {
    console.log("state for pin " + pinName);
    console.log(JSON.stringify(state));
    let msg = {
        msgType: 'pinStatus', pin: pinName,
        state: state
    };
    sendMessage(msg);
}

function requestStatus(msg) {
    console.log("showStatus");
    for (let pinName in pins) {
        let pin = pins[pinName];
        console.log("querying status of pin " + pinName);
        pin.query((state) => showState(pinName, state))
    }
}


//findDevice();

setupBoard(comPortPath);

//var io = require("socket.io")(server);
var io = require("socket.io").listen(server);
io.on("connection", function (socket) {
    sock = socket;
    console.log("Got connection...");
    activeSockets.push(socket);
    console.log("activeSOckets: " + activeSockets.length);
    socket.on("change:interval", function (data) {
        console.log("data: " + data);
        led.blink(data);
    });
    socket.on("servo.set", function (data) {
        //console.log("servo value: "+data);
        if (servo) {
            servo.to(data);
        }
        else
            console.log("No servo " + data);
    });
    socket.on("pins.set", function (msg) {
        setPins(msg);
    });
    socket.on("requestStatus", function (msg) {
        requestStatus(msg);
    });
    socket.on('disconnect', obj => handleDisconnect(socket, obj));
});

console.log("listening on " + addr + " port: " + port);
server.listen(port, addr);
setInterval(heartbeat, 2000);
