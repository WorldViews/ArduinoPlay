
import time

# states of motion
STILL = "STILL"
TAP = "TAP"

# modes
PLAY = "PLAY"       # we have some melody or sequence to play
LISTEN = "LISTEN"   # We are just watching for beats

# Note that time.time() only returns an int, not
# a float with fractional seconds, so we must use this
def nstime():
    return time.monotonic_ns()/1000000000.0

class RhythmTool:
    def __init__(self, cpx):
        self.cp = cpx
        self.t0 = nstime()
        self.n = 0
        self.state = STILL
        self.mode = LISTEN
        self.toneVal = None
        self.color = None

    def tick(self):
        self.n += 1
        t = nstime()
        rt = t - self.t0
        mag0 = 300
        if self.cp.button_a:
            self.setMode(PLAY)
        if self.cp.button_b:
            self.setMode(LISTEN)

        x, y, z = self.cp.acceleration  # read the accelerometer values
        mag = x*x + y*y + z*z
        if mag > mag0:
            #print ("strike", self.n, rt, mag, x, y, z)
            #print("t: %.3f   rt: %.3f" % (t, rt))
            self.setState(TAP)
        else:
            self.setState(STILL);
        if self.mode == PLAY:
            noteOn = rt % 1 < 0.1
            if noteOn:
                color = (100,100,100)
                if self.state == TAP:
                    color = (0,100,0)
                self.setColor(color)
                self.setTone(600)
            else:
                self.setColor((0,0,0))
                self.setTone(None)

    def setMode(self, mode):
        if mode == self.mode:
            return
        print("mode", mode)
        self.mode = mode

    def setColor(self, rgb):
        if self.color == rgb:
            return
        self.color = rgb
        print("color", rgb[0], rgb[1], rgb[2], "xxx")
        for i in range(10):
            self.cp.pixels[i] = (rgb)
  
    def setState(self, state):
        if self.state == state:
            return
        print("state", state)
        self.state = state
        if state == TAP:
            self.tap()
        if state == STILL:
            self.reset()

    def setTone(self, val):
        if val == self.toneVal:
            return
        self.toneVal = val
        if val:
            self.cp.start_tone(val)
        else:
            self.cp.stop_tone()

    def reset(self):
        print("reset")
        self.setState(STILL)
        if self.mode == LISTEN:
            self.setColor((0,0,0))
            self.setTone(None)
    
    def tap(self):
        print("tap")
        if self.mode == LISTEN:
            self.setTone(600)
            self.setColor((100,100,0))
