
var argv = process.argv;
var port = 3000;
//var port = 8089;
var addr = "0.0.0.0";
console.log("argv:", argv);

var sock = null;
var morgan = require('morgan');
var http = require("http");
var cors = require('cors');
var express = require("express");
var app = express();
app.use(morgan('common'));
app.use(cors());
var bodyParser = require('body-parser');
var server = http.createServer(app);

/////////////////////////////////////////////////
// web handling stuff...

app.use(express.static(__dirname + "/.."));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/realtime", function (req, res) {
  res.sendFile(__dirname + "/realtime.html");
});

/*
app.get("/*", function (req, res) {
    console.log("*** "+req.path);
    res.sendFile(__dirname + req.path);
});
*/

var tickCount = 0;

function heartbeat() {
    tickCount++;
    console.log("tick... "+tickCount);
    if (sock) {
        msg = {type: 'status', gen: tickCount, server: 'dummyServer_0.0', haveBoard: false};
        console.log("sending "+JSON.stringify(msg));
        sock.emit("status", msg);
    }
}

var io = require("socket.io").listen(server);
io.on("connection", function(socket) {
    sock = socket;
    console.log("Got connection...");
    socket.on("servo.set", function(data) {
        console.log("servo value: "+data);
    });
});

console.log("listening on "+addr+" port: "+port);
server.listen(port, addr);
setInterval(heartbeat, 4000);
