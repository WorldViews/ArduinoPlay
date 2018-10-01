'use strict';

var MUSE = require("./MUSEDefs.js").MUSE;
const five = require('johnny-five');
const Playground = require("playground-io");

var portal = MUSE.getPortal();
console.log("MUSE server "+portal.server);

var argv = process.argv;
var SerialPort = require("serialport");
var comPortPath = "com4";
var comPort = null;
var setupInProgress = false;

class Harness {
    constructor(opts) {
        var inst = this;
        this.tickCount = 0;
        comPortPath = opts.comPortPath || "com4";
        this.onBoardReady = opts.onBoardReady;
    }

    start() {
        let inst = this;
        this.setupBoard(comPortPath);
        setInterval(() => inst.heartbeat(), 2000);
    }

    heartbeat() {
        this.tickCount++;
        var open = comPort && comPort.isOpen;
        var status = open ? "open" : "closed";
        console.log("tick... "+this.tickCount+" "+comPortPath+" "+status);
        if (portal) {
            var msg = {type: 'status', portPath: comPortPath,
                       haveBoard: open};
            portal.sendMessage(msg);
        }
        if (!open) {
            if (!setupInProgress) {
                this.setupBoard(comPortPath);
            }
        }
    }
    
    setupBoard(comPortPath) {
        let inst = this;
        setupInProgress = true;
        console.log("Getting SerialPort for "+comPortPath);
        comPort = new SerialPort(comPortPath,
                                 (err) => {
                                     console.log("got callback: "+err);
                                     setupInProgress = false;
                                 },
                                 (err) => {
                                     console.log("got error callback: "+err);
                                     setupInProgress = false;
                                 });
        if (!setupInProgress) {
            console.log("Failed to get board...");
            return;
        }
        console.log("getting five.Board");
        let board = new five.Board({
            io: new Playground({
                port: comPort,

                // Passing Firmata options through:
                // Circuit Playground Firmata seems not to report version before timeout,
                // lower timeout to reduce initial connection time.
                reportVersionTimeout: 200
            })
        });
        this.board = board;
        board.on("exit", () => {
            console.log("Board exit...");
        });

        board.on("fail", () => {
            console.log("Board failed...");
        });
        board.on("ready", () => {
            setupInProgress = false;
            inst.onBoardReady(board)
        });
    }
}

if (typeof exports !== 'undefined') {
    console.log("setting up exports");
    exports.Harness = Harness;
}
