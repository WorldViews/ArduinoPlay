
function handleState(msg)
{
    var train = msg.train;
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
        this.portal = portal;
        portal.sock.on("MUSE.IOT", msg => {
            handleMessage(msg);
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
}


