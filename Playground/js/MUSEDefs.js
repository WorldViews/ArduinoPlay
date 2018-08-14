
var MUSE = {};

MUSE.getParameterByName = function(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

MUSE.museServer = "platonia:4000";

class MUSEPortal
{
    constructor(name) {
        this.name = name || document.location.host;
        this.sock = io.connect(MUSE.museServer);
        this.sendMessage({'msgType': 'init'});
        MUSE.portal = this;
    }

    sendMessage(msg) {
        this.sock.emit("MUSE.IOT", msg);
    }
}


MUSE.getPortal = function() {
    if (!MUSE.portal)
        MUSE.portal = new MUSEPortal();
    return MUSE.portal;
}

