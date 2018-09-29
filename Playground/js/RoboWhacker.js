
var t = 0;
var ros;
var hit_pos;
var x0 = 0.15;
var y0 = -0.02;
var dx = 0.02;
var dy = 0.02;
positions = [
    {x: 0.12,   y: -0.05},
    {x: 0.14,  y:  -0.05},
    {x: 0.16,   y:  -0.05},
    {x: 0.12,   y: 0},
    {x: 0.14,  y: 0},
    {x: 0.16,   y: 0},
   	{x: 0.12,   y:  0.05},
    {x: 0.14,  y: 0.05},
    {x: 0.16,   y: 0.05},
];

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

		ros = new ROSLIB.Ros({
			url : 'ws://192.168.16.177:9090'
		  });

		  ros.on('connection', function() {
			console.log('Connected to websocket server.');
		  });

		  ros.on('error', function(error) {
			console.log('Error connecting to websocket server: ', error);
		  });

		  ros.on('close', function() {
			console.log('Connection to websocket server closed.');
		  });

        this.ros = ros;
        /*
		var cmdVel = new ROSLIB.Topic({
		  ros : ros,
		  name : '/hit_num',
		  messageType : 'std_msgs/Int32'
	    });
        */

      /*
	  var cur_pos = new ROSLIB.Topic({
		  ros : ros,
		  name : '/joint_states',
		  messageType : 'sensor_msgs/JointState'
	  });

	  cur_pos.subscribe(function(message) {
		//console.log('Received message on ' + JSON.stringify(message));
		console.log('Received message on ' + JSON.stringify(message.position));
		//cur_pos.unsubscribe();
	  });
      */
      hit_pos = new ROSLIB.Topic({
        ros : ros,
        name : '/hit_pos',
        messageType : 'geometry_msgs/Vector3'
      });
      this.hit_pos = hit_pos;

	  var cur_pos = new ROSLIB.Topic({
        ros : ros,
        name : '/joint_states',
        messageType : 'sensor_msgs/JointState'
        });

        cur_pos.subscribe(function(message) {
        //console.log('Received message on ' + JSON.stringify(message));
		var str = JSON.stringify(message.position);
        console.log('Received message on ' + str);
		$("#status").html(str)
        //cur_pos.unsubscribe();
        });
    
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
		
		var i = Math.floor(idx/3);
		var j = idx % 3;
		console.log("i: "+i+" j: "+j);
		var x = x0 + dx * i;
		var y = y0 + dy * j;
		/*
        var x = 10;
        var y = 20;
        var z = 0;
        var pos = positions[idx];
        var x = pos.x;
        var y = pos.y;
		*/
        var z = 0.02;
        console.log("request hit at "+x+" "+y+" "+z);
		var num = new ROSLIB.Message({x, y, z});

		hit_pos.publish(num);
		console.log('sending robot to ' + num)
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

