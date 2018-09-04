
var TRAIN_OBJS = {};

function warning(str) {
    console.log(str);
    alert(str);
}

function getTrainObj(train)
{
    if (TRAIN_OBJS[train] == null)
        TRAIN_OBJS[train] = {name: train};
    return TRAIN_OBJS[train];
}

function handleState(msg)
{
    var train = msg.train;
    var tobj = getTrainObj(train);
    tobj.state = msg.state;

    if (train == "train1")
        $("#train1State").html(msg.state);
    else if (train == "train2")
        $("#train2State").html(msg.state);
    else
        console.log("Unknown train "+train);
}

function handleProximity(msg)
{
    var train = msg.train;
    var tobj = getTrainObj(train);
    tobj.location = msg.location;
    if (train == "train1")
        $("#train1Location").html(msg.location);
    else if (train == "train2")
        $("#train2Location").html(msg.location);
    else
        console.log("Unknown train "+train);
}

function handleMessage(msg)
{
    //console.log("got ", msg);
    var train = msg.train;
    if (msg.msgType == "train.newState") {
        handleState(msg);
    }
    if (msg.msgType == "train.proximity") {
        handleProximity(msg);
    }
    if (msg.msgType == "train.status") {
        handleState(msg);
        handleProximity(msg);
    }
    else {
        console.log("Unknown type for msg", msg);
    }
}


class TrainSystem
{
    constructor(portal) {
        var inst = this;
        this.movingTrain = null;//remove soon
        this.programState = "S1";
        this.portal = portal;
        this.channel = "MUSE.IOT";
        portal.sock.on(this.channel, msg => {
            handleMessage(msg);
            inst.updateProgram();
        });
    }

    sendMessage(msg) {
        this.portal.sendMessage(msg, this.channel);
    }
    
    moveForward(train) {
        this.sendMessage(
            {msgType: 'train.request', request: 'Forward', train: train});
    }

    moveReverse(train) {
        this.sendMessage(
            {msgType: 'train.request', request: 'Reverse', train: train});
    }

    stop(train) {
        this.sendMessage(
            {msgType: 'train.request', request: 'Stop', train: train});
    }

    updateProgram() {
        /* We will have a state machine with two main states.

        S1: THis state means train1 is not yet in the tunnnel,
        and train2 is in tunnel waiting to go.

        S1b: This state is when we are in passthrough, waiting for
        train2 to exit tunnel.;

        S2: This state means train2 is clear of the tunnel,
        and train1 is in tunnel waiting to go.

        */
        $("#programState").html(this.programState);
        console.log("updateProgram state: "+this.programState);
        var tobj1 = getTrainObj("train1");
        var tobj2 = getTrainObj("train2");
        if (tobj1 == null || tobj2 == null) {
            console.log("Cannot update program without both trains");
            return;
        }
        console.log("tobj1:", tobj1);
        console.log("tobj2:", tobj2);
        if (tobj1.location == "TUNNEL" && tobj2.location == "TUNNEL") {
            if (tobj1.state == "Stopped" && tobj2.state == "Stopped") {
                console.log("******* PASSTHROUGH ********")
                if (this.programState == "S1") {
                    this.moveForward("train2");
                    this.programState = "S1b";
                }
                else if (this.programState == "S2") {
                    this.moveReverse("train1");
                    this.programState = "S2b";
                }
            }
            else {
                console.log("*** TRANSITION OUT OF TUNNEL ***");
            }
        }
        if (this.programState == "S1b" && tobj2.state == "Forward")
            this.programState = "S2";
        if (this.programState == "S2b" && tobj1.state == "Reverse")
            this.programState = "S1";
        /*
        if (tobj1.state != "Stopped")
            this.movingTrain = "train1";
        else if (tobj2.state != "Stopped")
            this.movingTrain = "train2";
        else {
            this.movingTrain = null;
        }
        */
        $("#programState").html(this.programState);
    }
}
