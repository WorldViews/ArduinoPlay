
class StateView
{
    constructor(id) {
        this.id = id;
        var jqid = "#"+id;
        this.jqid = jqid;
        this.viewWd = 720;
        this.viewHt = 150;
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext("2d");
        this.markers = {};
        var inst = this;
        $(jqid).mousedown(e => inst.handleMousedown(e));
        $(jqid).mouseup(e => inst.handleMouseup(e));
        $(jqid).mousemove(e => inst.handleMousemove(e));
    }

    setMark(name, sx, y, color) {
        color = color || "black";
        console.log("setMark "+name+" "+sx+" "+y);
        this.markers[name] = {x: sx, y: y, color: color};
        this.redraw();
    }

    redraw()
    {
        var ctx = this.ctx;
        ctx.clearRect(0,0,1000,1000);
        for (var name in this.markers) {
            ctx.beginPath();
            var marker = this.markers[name];
            ctx.strokeStyle = marker.color;
            ctx.fillStyle = marker.color;
            ctx.arc(marker.x, marker.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    handleMousedown(e) {
        this.downX = e.clientX;
        this.downY = e.clientX;
        this.isDragging = true;
    }

  handleMouseup(e) {
      this.isDragging = false;
  }

  handleMousemove(e) {
     if (!this.isDragging)
        return;
    var ht = 150;
    var wd = 720.0;
    var x = e.offsetX;
    var y = e.offsetY - ht/2;
    var fx = x/wd;
    var servo = {min: 0, max: 180};
    var sx = interp(fx, servo.min, servo.max);
    console.log("dragging... fx: "+fx+"  y:"+y+"  sx: "+sx);
    gameComp.setServo(sx);
    //viewer.setMark("mouse", sx, 30, "green");
    this.setMark("mouse", sx, 30, "green");
  }
}
