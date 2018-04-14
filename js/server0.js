
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var server = require("http").Server(app);
var io = require("socket.io")(server);
var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function() {
  var led = new five.Led(13);
  var servo = new five.Servo(12);
  led.blink(1000);

  io.on("connection", function(socket) {
    console.log("Got connection...");
    socket.on("change:interval", function(data) {
        console.log("data: "+data);
        led.blink(data);
    });
    socket.on("servo.set", function(data) {
        console.log("servo value: "+data);
        servo.to(data);
    });
  });
});

app.use(express.static(__dirname + "/.."));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/mouseJoint", function (req, res) {
    var str = __dirname + "/mouseJoint.html"
    res.sendFile(str);
});

app.get("/realtime", function (req, res) {
  res.sendFile(__dirname + "/realtime.html");
});

server.listen(3000);
