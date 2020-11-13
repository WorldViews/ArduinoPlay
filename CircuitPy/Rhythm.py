
#from adafruit_circuitplayground.express import cpx

class RhythmTool:
    def __init__(self, cpx):
        self.cpx = cpx
        
    def reset(self):
        self.cpx.stop_tone()
        for i in range(10):
            self.cpx.pixels[i] = ((0, 0, 0))

    def flash(self):
        print ("flash")
        baseFreq = 100
        self.cpx.start_tone(baseFreq)
        RGB = (100,100,100)
 
        for i in range(10):
            self.cpx.pixels[i] = (RGB)

    def beep(self):
        print ("beep")

    def tap(self):
        self.flash()
