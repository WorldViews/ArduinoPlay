
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var server = require("http").Server(app);
var io = require("socket.io")(server);
var Playground = require("playground-io");
var five = require("johnny-five");
var sock = null;
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
  led.blink(1000);

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

server.listen(3000);
