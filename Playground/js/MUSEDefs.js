
var MUSE = {};

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

class MUSEPortal
{
    constructor(name) {
        this.channel = "MUSE.IOT";
        this.name = name || "client_"+document.location.host;
        this.server = MUSE.museServer;
        this.sock = io.connect(this.server);
        this.sendMessage({'msgType': 'init', 'client': this.name});
        MUSE.portal = this;
    }

    registerMessageHandler(handler) {
        this.sock.on(this.channel, msg => handler(msg));
    }

    sendMessage(msg, channel) {
        channel = channel || this.channel;
        this.sock.emit(channel, msg);
    }
}


MUSE.getPortal = function() {
    if (!MUSE.portal)
        MUSE.portal = new MUSEPortal();
    return MUSE.portal;
}

