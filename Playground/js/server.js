
var argv = process.argv;
var port = "3000";
//var port = 8089;
var addr = "0.0.0.0";
var SerialPort = require("serialport");
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
var light = null;
var led = null;
var servo = null;
//var board = new five.Board();
var board = null;
var pins = {
    2: null,
    3: null,
    6: null,
    10: null,
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


function setupPin(pin, pinName) {
    pin.on("data", (data) => {
        //console.log("pin "+pinName+" "+data);
        if (pin != pins[pinName]) {
            //console.log("ignore old pin...");
            return;
        }
        sendMessage("pin.change", data);
        sendMessage("pin.data", {pin: pinName, data: data});
    });
    pin.on("high", (data) => {
        //console.log("pin "+pinName+" "+data);
        if (pin != pins[pinName]) {
            //console.log("ignore old pin...");
            return;
        }
        sendMessage("pin.data", {pin: pinName, data: "high"});
    });
    pin.on("low", (data) => {
        //console.log("pin "+pinName+" "+data);
        if (pin != pins[pinName]) {
            //console.log("ignore old pin...");
            return;
        }
        sendMessage("pin.data", {pin: pinName, data: "low"});
    });
}

function setPin(pinName, value)
{
    console.log("set pin "+pinName+" "+value);
    var pin = pins[pinName];
    if (!pin) {
        console.log("No such pin as "+pinName);
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

    board.on("ready", function() {
        console.log("**** board ready - ****");
        //console.log(board);
        //console.log("comPort:", comPort);
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
            console.log("Creating pin "+pinName);
            var pin = new five.Pin({pin: pinName, board: board});
            pins[pinName] = pin;
            setupPin(pin, pinName);
            /*
            pin.on("data", (data) => {
                console.log("pin "+pinName+" "+data);
                if (pin != pins[pinName]) {
                    console.log("ignore old pin...");
                    return;
                }
                sendMessage("pin.change", data);
            });
            */
        }
        light = new five.Light({pin: 5, type: "analog", board: board});
        led.blink(1000);
        //console.log("Pin:", pin);
    
        var accelerometer = new five.Accelerometer({
            controller: Playground.Accelerometer,
            board: board
        });

        accelerometer.on("change", (data) => {
            //console.log("acc data: "+JSON.stringify(data));
            //console.log("acc data: "+data.x+" "+data.y+" "+data.z);
            //console.log("sending acc.change "+data.x+" "+data.y+" "+data.z);
            var acc = {x: data.x, y: data.y, z: data.z};
            //sock.emit("acc.change", data.x+" "+data.y+" "+data.z);
            sendMessage("acc.change", acc);
            //piezo.frequency(data.double ? 1500 : 500, 50);
        });

        if (light) {
            light.on("change", (data) => {
                //console.log("light: "+JSON.stringify(data));
                //console.log("lux:", data.lux);
                sendMessage("light.change", data);
            });
        }

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
    console.log("tick... "+tickCount+" "+port+" "+comPortPath+" "+status);
    if (sock) {
        msg = {type: 'status', portPath: comPortPath,
               //deviceId: deviceId,
               //deviceName: deviceName,
               gen: tickCount, haveBoard: false};
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

function handleDisconnect(socket)
{
    console.log("handleDisconnect: ", socket);
    var index = activeSockets.indexOf(socket);
    if (index >= 0) {
        activeSockets.splice(index, 1);
    }
    console.log("activeSockets "+activeSockets.length);
}

function setPins(msg)
{
    console.log("setPins: ",msg);
    var ops = msg;
    ops.forEach(op => {
        var pinName = op.pin;
        var value = op.value;
        setPin(pinName, value);
    });
}

//findDevice();

setupBoard(comPortPath);

//var io = require("socket.io")(server);
var io = require("socket.io").listen(server);
io.on("connection", function(socket) {
    sock = socket;
    console.log("Got connection...");
    activeSockets.push(socket);
    console.log("activeSOckets: " + activeSockets.length);
    socket.on("change:interval", function(data) {
        console.log("data: "+data);
        led.blink(data);
    });
    socket.on("servo.set", function(data) {
        //console.log("servo value: "+data);
        if (servo)
            servo.to(data);
        else
            console.log("No servo "+data);
    });
    socket.on("pins.set", function(msg) {
        setPins(msg);
    });
    socket.on('disconnect', obj => handleDisconnect(socket, obj));
});

console.log("listening on "+addr+" port: "+port);
server.listen(port, addr);
setInterval(heartbeat, 2000);
