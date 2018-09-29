'use strict';

var MUSE = require("./MUSEDefs.js").MUSE;

var portal = MUSE.getPortal();
console.log("MUSE server "+portal.server);

let pin0 = null;
let pin2 = null;

const {
  EtherPortClient
} = require('etherport-client');
const five = require('johnny-five');
const board = new five.Board({
  port: new EtherPortClient({
    host: '192.168.16.200',
    port: 3030
  }),
  repl: false
});

board.on('ready', () => {
    console.log("board ready");
    board.pinMode(0, five.Pin.OUTPUT);
    board.pinMode(2, five.Pin.INPUT);
    pin0 = new five.Pin(0);
    pin2 = new five.Pin(2);
    let prevVal = 0;
    var playPortal = false;
    pin0.read((err,val) => {
        if (val != prevVal) {
            console.log("new val for pin0 "+val);
            if (val) {
                playPortal = !playPortal;
                console.log("play: "+playPortal);
                var msg = {type: "pano.control",
                           playSpeed: playPortal ? 1 : 0};
                console.log("send msg "+JSON.stringify(msg));
                portal.sendMessage(msg, "pano");
                pin2.write(playPortal ? 0 : 1);
            }
        }
        prevVal = val;
    });
    /*
    let value = 0;
    setInterval(() => {
        value++;
        pin2.write(value % 3 == 0 ? 0 : 1);
    }, 1000);
    */
});

