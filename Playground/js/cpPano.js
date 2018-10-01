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
var buttonA, buttonB;

function send(msg)
{
    console.log("send msg "+JSON.stringify(msg));
    portal.sendMessage(msg, "pano");
}
    
function onBoardReady(board) {
    console.log("**** board ready - ****");
    //console.log(board);
    //console.log("comPort:", comPort);
    console.log("Getting led pin 13 for this board");
    led = new five.Led({pin: 13, board: board});
    light = new five.Light({pin: 5, type: "analog", board: board});
    buttonA = new five.Button({pin: 4, board: board});
    buttonB = new five.Button({pin: 19, board: board});
    led.blink(50);
    buttonA.on("down", () => {
        console.log("buttonA down");
        send({type: "pano.control", playSpeed: 0});
    });
    buttonB.on("down", () => {
        console.log("buttonB down");
        send({type: "pano.control", playSpeed: 1});
    });
    light.on("change", (data) => {
        //console.log("light: "+JSON.stringify(data));
    });
}

var harness = new Harness({onBoardReady});
harness.start();
