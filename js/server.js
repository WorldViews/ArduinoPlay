
var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function() {
  var led = new five.Led(13);
  led.blink(1000);

  io.on("connection", function(socket) {
    console.log("Got connection...");
    socket.on("change:interval", function(data) {
        console.log("data: "+data);
        led.blink(data);
    });
    socket.on("servo:value", function(data) {
        console.log("servo value: "+data);
        //led.blink(data);
    });
  });
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/realtime.html");
});

server.listen(3000);
