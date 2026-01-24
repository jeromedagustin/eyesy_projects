import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - Circle Row - LFO
 * Ported from Python version
 * 
 * Knob1 - number of circles
 * Knob2 - circle size
 * Knob3 - y position step amount (bounce speed)
 * Knob4 - foreground color
 * Knob5 - background color
 */
class LFO {
  public start: number;
  public max: number;
  public step: number;
  public current: number;
  public direction: number;

  constructor(start: number, max: number, step: number) {
    this.start = start;
    this.max = max;
    this.step = step;
    this.current = 0;
    this.direction = 1;
  }

  update(): number {
    this.current += this.step * this.direction;
    // When it gets to the top, flip direction
    if (this.current >= this.max) {
      this.direction = -1;
      this.current = this.max; // in case it steps above max
    }
    // When it gets to the bottom, flip direction
    if (this.current <= this.start) {
      this.direction = 1;
      this.current = this.start; // in case it steps below min
    }
    return this.current;
  }
}

export class Circlerowlfo implements Mode {
  private xr = 1280;
  private yr = 720;
  private ypos: LFO;
  private triggerPulse: number = 0.0;
  private triggerDecay: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.ypos = new LFO(0, 720, 10);
    this.ypos.max = this.yr;
    this.triggerPulse = 0.0;
    this.triggerDecay = 0.05;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    // Handle trigger when mic is disabled
    if (eyesy.trig && !eyesy.mic_enabled) {
      this.triggerPulse = 1.0;
      this.triggerDecay = 0.05;
    }
    if (this.triggerPulse > 0) {
      this.triggerPulse = Math.max(0, this.triggerPulse - this.triggerDecay * eyesy.deltaTime * 1000);
    }

    const ystepmod = this.yr * 0.069;
    const circmod = this.xr * 0.020;
    const offsetmod = this.xr * 0.023;
    this.ypos.step = Math.floor(eyesy.knob3 * 5 * ystepmod);
    const circles = Math.floor(eyesy.knob1 * circmod) + 1;
    const space = this.xr / circles;
    const offset = Math.floor((eyesy.knob2 * 7) * offsetmod);
    const y = this.ypos.update();

    for (let i = 0; i < circles; i++) {
      // Use AudioScope for consistent audio handling
      // Python version uses abs(audio_in[i + 3] / 100)
      const audioVal = AudioScope.getSampleClamped(eyesy, i + 3, 100.0);
      const combinedAudioVal = eyesy.mic_enabled ? Math.abs(audioVal * 32768) : (this.triggerPulse * 32768);
      const audio = combinedAudioVal / 100;
      const r = Math.floor(audio + offset) + 4;
      const ax = Math.floor((i * space) + (space / 2));
      canvas.circle([ax, y], r, color, 0);
    }
  }
}
