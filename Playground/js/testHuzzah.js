'use strict';

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
//    board.pinMode(0, five.Pin.INPUT);
    //board.pinMode(2, five.Pin.OUTPUT);
    board.pinMode(2, five.Pin.INPUT);
  // the Led class was acting hinky, so just using Pin here
    const pin0 = new five.Pin(0);
    const pin2 = new five.Pin(2);
    pin0.on("data", (data) => {
        console.log("pin0 data: "+data);
    });
    pin0.on("high", (data) => {
        console.log("pin0 high");
    });
    pin0.on("low", (data) => {
        console.log("pin0 low");
    });
    pin0.read((err,val) => {
        console.log("read pin0 val "+val);
    });
    let value = 0;
    setInterval(() => {
        console.log("tick");
        value++;
        //pin0.write(value % 2 == 0 ? 0 : 1);
        pin2.write(value % 3 == 0 ? 0 : 1);
    }, 1000);
});

