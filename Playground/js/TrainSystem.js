
var TRAIN_OBJS = {};

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
    console.log("got ", msg);
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
        this.portal = portal;
        portal.sock.on("MUSE.IOT", msg => {
            handleMessage(msg);
            inst.updateProgram();
        });
    }

    moveForward(train) {
        this.portal.sendMessage(
            {msgType: 'train.request', request: 'Forward', train: train});
    }

    moveReverse(train) {
        this.portal.sendMessage(
            {msgType: 'train.request', request: 'Reverse', train: train});
    }

    stop(train) {
        this.portal.sendMessage(
            {msgType: 'train.request', request: 'Stop', train: train});
    }

    updateProgram() {
        console.log("updateProgram");
        var tobj1 = getTrainObj("train1");
        var tobj2 = getTrainObj("train2");
        if (tobj1 == null || tobj2 == null) {
            console.log("Cannot update program without both trains");
            return;
        }
        console.log("tobj1:", tobj1);
        console.log("tobj2:", tobj2);
    }
}


