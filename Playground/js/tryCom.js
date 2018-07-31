
var SerialPort = require("serialport")

function ready(args)
{
    console.log("ready: "+args);
}

function errFun(args)
{
    console.log("errFun: "+args);
}

var sp = new SerialPort("com4", ready, errFun);
console.log("sport: "+sp);
