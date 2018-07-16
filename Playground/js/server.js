
var argv = process.argv;
var port = 3000;
//var port = 8089;
var addr = "0.0.0.0";
var comPort = "com4";
console.log("argv:", argv);
if (argv.length > 2)
    comPort = argv[2];
console.log("Using com port: "+comPort);
var Playground = require("playground-io");
var five = require("johnny-five");
var sock = null;
var activeSockets = [];
var pin = null;
var light = null;
var led = null;
var servo = null;
//var board = new five.Board();
var board = null;

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

function setupBoard(comPort) {
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
        console.log("**** board ready ****");
        led = new five.Led(13);
        servo = new five.Servo(12);
    //    pin = new five.Pin({pin: 10, mode: five.Pin.INPUT});
        pin = new five.Pin("A9");
        light = new five.Light("A5");
        led.blink(1000);
        console.log("Pin:", pin);
    
        var accelerometer = new five.Accelerometer({
         controller: Playground.Accelerometer
        });

        accelerometer.on("change", (data) => {
            //console.log("acc data: "+JSON.stringify(data));
            console.log("acc data: "+data.x+" "+data.y+" "+data.z);
            //console.log("sock: "+sock);
            console.log("sending acc.change "+data.x+" "+data.y+" "+data.z);
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
        if (pin) {
            pin.on("data", (data) => {
                //console.log("pin: "+data);
                sendMessage("pin.change", data);
            });
        }
    });
}


var tickCount = 0;

function heartbeat() {
    tickCount++;
    console.log("tick... "+tickCount);
    if (sock) {
        msg = {type: 'status', gen: tickCount, haveBoard: false};
        if (pin)
            msg.haveBoard = true;
        //console.log("sending "+JSON.stringify(msg));
        sendMessage("status", msg);
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

setupBoard(comPort);
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
    socket.on('disconnect', obj => handleDisconnect(socket, obj));
});

console.log("listening on "+addr+" port: "+port);
server.listen(port, addr);
setInterval(heartbeat, 2000);
