
function handleMessage(msg)
{
    console.log("got ", msg);
    var train = msg.train;
    if (msg.msgType == "train.newState") {
        if (train == "train1")
            $("#train1State").html(msg.state);
        else if (train == "train2")
            $("#train2State").html(msg.state);
        else
            console.log("Unknown train "+train);
    }
    if (msg.msgType == "train.proximity") {
        if (train == "train1")
            $("#train1Location").html(msg.location);
        else if (train == "train2")
            $("#train2Location").html(msg.location);
        else
            console.log("Unknown train "+train);
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


