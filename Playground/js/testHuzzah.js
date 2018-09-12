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

const LED_PIN = 2;

board.on('ready', () => {
  board.pinMode(LED_PIN, five.Pin.OUTPUT);
  // the Led class was acting hinky, so just using Pin here
  const pin = five.Pin(LED_PIN);
  let value = 0;
  setInterval(() => {
    if (value) {
      pin.high();
      value = 0;
    } else {
      pin.low();
      value = 1;
    }
  }, 500);
});
