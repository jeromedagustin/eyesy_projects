import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - Bouncing Bars LFO
 * Ported from Python version
 * 
 * Knob1 - bar size
 * Knob2 - x movement speed
 * Knob3 - y bounce speed
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
    this.current += this.step * this.direction;
    return this.current;
  }
}

export class Bouncingbarslfo implements Mode {
  private bounce1: LFO;
  private bounce2: LFO;
  private xmover1: LFO;
  private xmover2: LFO;
  private triggerPulse: number = 0.0;
  private triggerDecay: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.bounce1 = new LFO(0, 720, 10);
    this.bounce2 = new LFO(0, 720, 19);
    this.xmover1 = new LFO(0, 640, 30);
    this.xmover2 = new LFO(0, 640, 15);
    this.triggerPulse = 0.0;
    this.triggerDecay = 0.05;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Handle trigger when mic is disabled
    if (eyesy.trig && !eyesy.mic_enabled) {
      this.triggerPulse = 1.0;
      this.triggerDecay = 0.05;
    }
    if (this.triggerPulse > 0) {
      this.triggerPulse = Math.max(0, this.triggerPulse - this.triggerDecay * eyesy.deltaTime * 1000);
    }

    // Use AudioScope for consistent audio handling
    // Python version uses audio_in[30] / 50 and audio_in[70] / 50
    const audioVal1 = AudioScope.getSampleClamped(eyesy, 30, 50.0);
    const audioVal2 = AudioScope.getSampleClamped(eyesy, 70, 50.0);
    const y = eyesy.mic_enabled ? audioVal1 : (this.triggerPulse * 32768 / 50);
    const y2 = eyesy.mic_enabled ? audioVal2 : (this.triggerPulse * 32768 / 50);
    const color = eyesy.color_picker(eyesy.knob4);
    const size1 = Math.floor(eyesy.knob1 * 250) + 1;

    this.bounce1.step = Math.floor(eyesy.knob3 * 25) + 1;
    this.bounce2.step = Math.floor(eyesy.knob3 * 50) + 1;
    const posy1 = this.bounce1.update();
    const posy2 = this.bounce2.update();

    this.xmover1.step = Math.floor(eyesy.knob2 * 50) + 1;
    this.xmover2.step = Math.floor(eyesy.knob2 * 25) + 1;
    const posx1 = this.xmover1.update();
    const posx2 = this.xmover2.update();

    // Draw horizontal lines
    canvas.line([0 + posx1, posy1], [y + posx1, posy1], color, size1);
    canvas.line([eyesy.xres - posx2, posy2], [eyesy.xres - y2 - posx2, posy2], color, size1);

    // Find peak audio value using AudioScope
    const peak = AudioScope.getPeak(eyesy, 0, 100);
    const peakScaled = peak * 32768; // Convert back to raw range for /300 calculation
    const R = (peakScaled / 300) + (eyesy.knob3 * 100);
    // Note: The Python version has a commented-out circle draw
    // canvas.circle([640, 360], Math.floor(R) + 10, color, 0);
  }
}
