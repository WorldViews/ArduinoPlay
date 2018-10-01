
var MUSE = {};

//if (typeof io === 'undefined') {
//    io = require("socket.io-client");
//}

MUSE.getParameterByName = function(name) {
    if (typeof window === 'undefined') {
        console.log("***** getParameterByName called outside of browser...");
        return null;
    }
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
        console.log("creating MUSEPortal "+name+" "+server);
        let inst = this;
        let host;
        if (typeof document !== 'undefined') {
            server = server || MUSE.getParameterByName("museServer");
            host = document.location.host;
        }
        else {
            host = require('os').hostname();
        }
        name = name || "unknown";
        name = name + "_"+ host;
        this.name = name;
        this.channel = "MUSE.IOT";
        this.server = server || MUSE.museServer;
        if (typeof io === 'undefined') {
            console.log("getting socket.io-client via require...");
            var io = require("socket.io-client");
            this.sock = io("http://"+this.server);
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
        setInterval(() => inst.sendHeartbeat(), 2000);
    }

    sendHeartbeat() {
        let msg = {msgType: 'heartbeat', client: this.name};
        this.sendMessage(msg);
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


MUSE.getPortal = function(name, server) {
    console.log("getPortal "+name+" "+server);
    if (!MUSE.portal)
        MUSE.portal = new MUSEPortal(name, server);
    return MUSE.portal;
}

if (typeof exports !== 'undefined') {
    console.log("setting up exports");
    exports.MUSE = MUSE;
}

