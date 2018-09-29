
var MUSE = {};

//if (typeof io === 'undefined') {
//    io = require("socket.io-client");
//}

MUSE.getParameterByName = function(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function getClockTime()
{
    return new Date().getTime()/1000.0;
}

MUSE.getClockTime = getClockTime;


//MUSE.museServer = "platonia:4000";
MUSE.museServer = "sasaki:4000";
//MUSE.museServer = "sasaki.fxpal.net:4000";

class MUSEPortal
{
    constructor(name, server) {
        let inst = this;
        if (typeof document !== 'undefined') {
            server = MUSE.getParameterByName("museServer");
            name = name || "client_"+document.location.host;
        }
        else {
            name = name || "client_"+require('os').hostname();
        }
        this.channel = "MUSE.IOT";
        this.name = name || "unknown";
        this.server = server || MUSE.museServer;
        if (typeof io === 'undefined') {
            //io = require("socket.io-client")(this.server);
            console.log("getting socket.io-client via require...");
            //this.sock = require("socket.io-client")(this.server);
            this.sock = require("socket.io-client")("http://"+this.server);
        }
        else {
            this.sock = io.connect(this.server);
        }
        console.log("sock.connected ", this.sock.connected);
        this.sendMessage({'msgType': 'init', 'client': this.name});
        MUSE.portal = this;
        this.sock.on('connect', () => {
            console.log("socket is connected");
            console.log("sock.connected ", inst.sock.connected);
        });
    }

    registerMessageHandler(handler) {
        this.sock.on(this.channel, msg => handler(msg));
    }

    sendMessage(msg, channel) {
        channel = channel || this.channel;
        console.log("to "+this.server+" channel "+channel+" msg: ", msg);
        this.sock.emit(channel, msg);
    }
}


MUSE.getPortal = function() {
    if (!MUSE.portal)
        MUSE.portal = new MUSEPortal();
    return MUSE.portal;
}

if (typeof exports !== 'undefined') {
    console.log("setting up exports");
    exports.MUSE = MUSE;
}

