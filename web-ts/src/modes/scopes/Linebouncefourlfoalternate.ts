import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - Line Bounce Four - LFO Alternate
 * Ported from Python version
 * 
 * Knob1 - vertical line width
 * Knob2 - horizontal line width
 * Knob3 - speed
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

export class Linebouncefourlfoalternate implements Mode {
  private xr = 1280;
  private yr = 720;
  private x100 = 0;
  private b1: LFO;
  private b2: LFO;
  private b3: LFO;
  private b4: LFO;
  private xLinesFirst = true;
  private triggerPulse: number = 0.0;
  private triggerDecay: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.x100 = this.xr * 0.078;
    this.b1 = new LFO(0, this.xr, 10); // top x line
    this.b2 = new LFO(0, this.xr, 19); // bottom x line
    this.b3 = new LFO(0, this.yr / 2, 2); // top y line
    this.b4 = new LFO(this.yr / 2, this.yr, 2); // bottom y line
    this.xLinesFirst = true;
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
    // Python version uses abs(audio_in[50] / 85)
    const audioVal = AudioScope.getSampleClamped(eyesy, 50, 85.0);
    const combinedAudioVal = eyesy.mic_enabled ? Math.abs(audioVal) : (this.triggerPulse * 32768 / 85);
    const y = combinedAudioVal;
    const color = eyesy.color_picker(eyesy.knob4);
    const color2 = eyesy.color_picker((eyesy.knob4 + 0.25) % 1.00);
    const color3 = eyesy.color_picker((eyesy.knob4 + 0.50) % 1.00);
    const color4 = eyesy.color_picker((eyesy.knob4 + 0.75) % 1.00);
    const size1 = Math.floor(eyesy.knob1 * this.x100) + 1;
    const size2 = Math.floor(eyesy.knob2 * (this.x100 / 2)) + 1;
    
    // Update the horizontal lines so they end/start at yres/2 depending on line width
    this.b3.max = (this.yr / 2) - (size2 / 2);
    this.b4.start = (this.yr / 2) + (size2 / 2);
    
    this.b1.step = Math.floor(eyesy.knob3 * (this.xr * 0.0125)) + 5; // top x line
    this.b2.step = Math.floor(eyesy.knob3 * (this.xr * 0.0242)) + 5; // bottom x line
    this.b3.step = Math.floor(eyesy.knob3 * (this.x100 / 20)) + 2; // top y line
    this.b4.step = Math.floor(eyesy.knob3 * (this.x100 / 20)) + 2; // bottom y line
    
    const posx1 = this.b1.update(); // top x line
    const posx2 = this.b2.update(); // bottom x line
    const posy1 = this.b3.update(); // top y line
    const posy2 = this.b4.update(); // bottom y line
    
    // Check if b1 LFO reaches the start or max point
    if (posx1 === this.b1.start || posx1 === this.b1.max) {
      // 50% chance to set xLinesFirst to True or False
      this.xLinesFirst = Math.random() < 0.5;
    }
    
    // Draw based on the xLinesFirst boolean
    if (this.xLinesFirst) {
      canvas.line([posx1, (this.yr / 4) - y], [posx1, this.yr / 2], color, size1); // top x line
      canvas.line([posx2, this.yr / 2], [posx2, (this.yr * 0.75) + y], color2, size1); // bottom x line
      canvas.line([0, posy1], [this.xr, posy1], color3, size2); // top y line
      canvas.line([0, posy2], [this.xr, posy2], color4, size2); // bottom y line
    } else {
      canvas.line([0, posy1], [this.xr, posy1], color3, size2); // top y line
      canvas.line([0, posy2], [this.xr, posy2], color4, size2); // bottom y line
      canvas.line([posx1, (this.yr / 4) - y], [posx1, this.yr / 2], color, size1); // top x line
      canvas.line([posx2, this.yr / 2], [posx2, (this.yr * 0.75) + y], color2, size1); // bottom x line
    }
  }
}
