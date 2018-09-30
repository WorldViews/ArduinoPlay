'use strict';

var MUSE = require("./MUSEDefs.js").MUSE;
var Harness = require("./MUSEArduino.js").Harness;
const five = require('johnny-five');
const Playground = require("playground-io");

var portal = MUSE.getPortal();
console.log("MUSE server "+portal.server);

var board = null;
var led = null;
var servo = null;
var light = null;

function onBoardReady(board) {
    console.log("**** board ready - ****");
    //console.log(board);
    //console.log("comPort:", comPort);
    console.log("Getting led pin 13 for this board");
    led = new five.Led({pin: 13, board: board});
    console.log("Getting servo for this board");
    servo = new five.Servo({pin: 12, board: board});
    light = new five.Light({pin: 5, type: "analog", board: board});
    led.blink(1000);
    //console.log("Pin:", pin);
    
    var accelerometer = new five.Accelerometer({
        controller: Playground.Accelerometer,
        board: board
    });

    accelerometer.on("change", (data) => {
        var acc = {x: data.x, y: data.y, z: data.z};
        console.log("acc: "+JSON.stringify(acc));
        //sock.emit("acc.change", data.x+" "+data.y+" "+data.z);
        //portal.sendMessage("acc.change", acc);
    });

    light.on("change", (data) => {
        console.log("light: "+JSON.stringify(data));
        //console.log("lux:", data.lux);
        //portal.sendMessage("light.change", data);
    });

}

var harness = new Harness(onBoardReady);
harness.start();
