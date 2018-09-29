
'use strict';

var MUSE = require("./MUSEDefs.js").MUSE;

var portal = MUSE.getPortal();
console.log("MUSE server "+portal.server);

portal.registerMessageHandler(msg => {
    console.log("received msg: ", msg);
});



                              
