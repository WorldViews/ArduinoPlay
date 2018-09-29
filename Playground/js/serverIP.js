
var argv = process.argv;
var port = "3000";
//var port = 8089;
var addr = "0.0.0.0";
var SerialPort = require("serialport");
var { EtherPortClient } = require('etherport-client');
var etherPortClient = null;
var comPortPath = null;
var comPort = null;

console.log("***** Running serverIP.js ****");
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
var led0 = null;
var led2 = null;
var servo = null;
//var board = new five.Board();
var board = null;
var pins = {
    0: null,
    1: null,
//    2: null,
    3: null,
    6: null,
    10: null,
    11: null,
//    "A9": null,
};

pins = {};

var pinModes = {
//    2: five.Pin.INPUT,
};
/*
 */
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
        //sendMessage("pin.data", {pin: pinName, data: "high"});
        sendMessage("pin.data", {pin: pinName, data: 1});
    });
    pin.on("low", (data) => {
        //console.log("pin "+pinName+" "+data);
        if (pin != pins[pinName]) {
            //console.log("ignore old pin...");
            return;
        }
        //sendMessage("pin.data", {pin: pinName, data: "low"});
        sendMessage("pin.data", {pin: pinName, data: 0});
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
    if (comPortPath.indexOf(".") >= 0) {
        isEthernet = true;
        console.log("Using IP address "+comPortPath);
        etherPortClient = new EtherPortClient({
            host:comPortPath,
            port: 3030
        });
        comPort = etherPortClient;
        comPort.isOpen = false;
        comPort.on('error', err => {
            console.log("******* ERROR ******", err);
        });
        comPort.on('close', () => {
            console.log("******* CLOSE ******");
            comPort.isOpen = false;
        });
    }
    else {
        comPort = new SerialPort(comPortPath,
                                 (err) => {
                                     console.log("got callback: "+err);
                                     setupInProgress = false;
                                 },
                                 (err) => {
                                     console.log("got error callback: "+err);
                                     setupInProgress = false;
                                 });
    }
    if (!setupInProgress) {
        console.log("Failed to get board...");
        return;
    }
    console.log("getting five.Board");
    if (etherPortClient) {
        //console.log("Using EtherPortClient", etherPortClient);
        board = new five.Board({
            port: etherPortClient,
            repl: false
        });
    }
    else {
        console.log("*************** SHOULD NOT HAPPEN ***********");
        board = new five.Board({
            io: new Playground({
                port: comPort,

                // Passing Firmata options through:
                // Circuit Playground Firmata seems not to report version before timeout,
                // lower timeout to reduce initial connection time.
                reportVersionTimeout: 200
            })
        });
    }

    board.on("timeout", () => {
        console.log("**** board timeout ****");
    });

    board.on("error", () => {
        console.log("**** board error ****");
    });
    
    board.on("ready", function() {
        console.log("**** board ready - ****");
        comPort.isOpen = true;
        //console.log(board);
        //console.log("comPort:", comPort);
        setupInProgress = false;
        if (etherPortClient == null && !comPort.isOpen) {
            console.log("aborting board initialization - com port not open");
            return;
        }
        console.log("Getting led pin 0 for this board");
        led0 = new five.Led({pin: 0, board: board});
        console.log("Getting led pin 2 for this board");
        led2 = new five.Led({pin: 2, board: board});
        //console.log("Getting servo for this board");
        //servo = new five.Servo({pin: 12, board: board});
        for (var pinName in pins) {
            console.log("Creating pin "+pinName);
            var pin = new five.Pin({pin: pinName,
                                    type: "digital",
                                    mode: pinModes[pinName],
                                    board: board});
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

function setLed(name, led, val)
{
    if (led == null)
        return;
    if (val) {
        console.log("led on "+name);
        led.on();
        led.brightness(255);
    }
    else {
        console.log("led off "+name);
        led.off();
        led.brightness(0);
    }
}

function heartbeat() {
    tickCount++;
//    if (tickCount && (tickCount % 20) == 0) {
//        console.log("comPort:\n", comPort);
//    }
    var status = (comPort && comPort.isOpen) ? "open" : "closed";
    console.log("tick... "+tickCount+" "+port+" "+comPortPath+" "+status);
    setLed("0", led0, tickCount % 2 == 0);
    setLed("2", led2, tickCount % 3 == 0);
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
    //    if (!(comPort && comPort.isOpen)) {
    if (etherPortClient != null) {
        //console.log("...");
    }
    else {
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

function showState(pinName, state)
{
    console.log("state for pin "+pinName);
    console.log(JSON.stringify(state));
    let msg = {msgType: 'pinStatus', pin: pinName,
               state: state};
    sendMessage(msg);
}

function requestStatus(msg)
{
    console.log("showStatus");
    for (let pinName in pins) {
        let pin = pins[pinName];
        console.log("querying status of pin "+pinName);
        pin.query((state) => showState(pinName, state))
    }
}


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
    socket.on("requestStatus", function(msg) {
        requestStatus(msg);
    });
    socket.on('disconnect', obj => handleDisconnect(socket, obj));
});

console.log("listening on "+addr+" port: "+port);
server.listen(port, addr);
setInterval(heartbeat, 500);
