
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var server = require("http").Server(app);
var io = require("socket.io")(server);
var Playground = require("playground-io");
var five = require("johnny-five");
var sock = null;
var pin = null;
//var board = new five.Board();
var board = new five.Board({
  io: new Playground({
    port: "com4",

    // Passing Firmata options through:
    // Circuit Playground Firmata seems not to report version before timeout,
    // lower timeout to reduce initial connection time.
    reportVersionTimeout: 200
  })
});

board.on("ready", function() {
    var led = new five.Led(13);
    var servo = new five.Servo(12);
//    pin = new five.Pin({pin: 10, mode: five.Pin.INPUT});
    pin = new five.Pin("A9");
    //pin = new five.Pin("D9");
    /*
    pin = new five.Pin({pin: 10,
                          type: "analog",
                          mode: five.Pin.ANALOG});
    */
    led.blink(1000);
    console.log("Pin:", pin);
    
    var accelerometer = new five.Accelerometer({
        controller: Playground.Accelerometer
    });

    accelerometer.on("change", (data) => {
        //console.log("acc data: "+JSON.stringify(data));
        console.log("acc data: "+data.x+" "+data.y+" "+data.z);
        console.log("sock: "+sock);
        if (sock) {
            console.log("sending acc.change "+data.x+" "+data.y+" "+data.z);
            var acc = {x: data.x, y: data.y, z: data.z};
            //sock.emit("acc.change", data.x+" "+data.y+" "+data.z);
            sock.emit("acc.change", acc);
        }
        //piezo.frequency(data.double ? 1500 : 500, 50);
    });


    pin.on("data", (data) => {
        console.log("pin: "+data);
    });

    io.on("connection", function(socket) {
        sock = socket;
        console.log("Got connection...");
        socket.on("change:interval", function(data) {
            console.log("data: "+data);
            led.blink(data);
        });
        socket.on("servo.set", function(data) {
            //console.log("servo value: "+data);
            servo.to(data);
        });
    });
});

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

server.listen(3000);
