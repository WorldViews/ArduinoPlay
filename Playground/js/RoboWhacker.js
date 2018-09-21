
var t = 0;

function rand(n)
{
    return Math.floor(Math.random()*1000000) % n;
}

function getClockTime()
{
    return new Date().getTime()/1000.0;
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function remove(array, element) {
    const index = array.indexOf(element);
    
    if (index !== -1) {
        array.splice(index, 1);
    }
}

class Whacker {
    constructor(canvName) {
        var inst = this;
        this.portal = new MUSEPortal();
        this.portal.registerMessageHandler(msg => inst.handleMessage(msg));
	this.start();
        var str = "server: "+this.portal.server;
        $("#debug").html(str);
    }

    start() {
    }

    handleTick() {
    }

    sendMessage(msg) {
        //console.log("sendMessage "+JSON.stringify(msg));
        this.portal.sendMessage(msg);
    }
    
    handleMessage(msg) {
        //console.log("handleMessage "+JSON.stringify(msg));
        if (msg.msgType == "whack.setMolePos") {
            this.setMolePosition(msg.index);
        }
        else if (msg.msgType == "whack.hitHole") {
            console.log("hitHole: "+msg.index);
            this.handleHit(msg.index);
        }
        else if (msg.msgType == "whack.mousePos") {
        }
        else {
            console.log("unexpected message "+JSON.stringify(msg));
        }
    }
    
    handleHit(idx) {
        console.log("handleHit", idx);
        $("#requestedHole").html("hit hole "+idx);
    }

    setMolePosition(idx) {
        console.log("setMolePosition", idx);
        $("#requestedHole").html("goto hole "+idx);
    }
}

var whacker = null;

$(document).ready(() => {
    whacker = new Whacker();
    $("#play").click(() => {
        game.start();
    });
    setInterval(() => whacker.handleTick(), 1000);
});

