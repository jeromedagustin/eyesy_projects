import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - Football Scope
 * Ported from Python version
 * 
 * Knob1 - X position base
 * Knob2 - Y position base
 * Knob3 - Circle radius
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
export class FootballScope implements Mode {
  private colorRate = 0;
  private lineCount = 100;
  private triggerPulse: number = 0.0;
  private triggerDecay: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
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

    for (let i = 0; i < this.lineCount; i++) {
      this.seg(canvas, eyesy, i);
    }
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const x0 = Math.floor(eyesy.knob2 * eyesy.yres);
    // Use AudioScope for consistent audio handling
    // Python version uses audio_in[i] / 50, so we use custom divisor
    const audioVal = AudioScope.getSample(eyesy, i, 50.0);
    const combinedAudioVal = eyesy.mic_enabled ? audioVal : (this.triggerPulse * 32768 / 50);
    const x1 = Math.floor(eyesy.knob1 * eyesy.xres) + combinedAudioVal;
    const circlespace = eyesy.xres / this.lineCount;
    const circlebuff = 0;
    const circleradmax = Math.floor(eyesy.xres * 0.01);
    const y = i * circlespace;
    const yOff = -100;

    let color: [number, number, number];
    if (eyesy.knob4 < 0.5) {
      this.colorRate = (this.colorRate + (eyesy.knob4 - 0.5) * 0.001) % 1.0;
      color = eyesy.color_picker((i * 0.01 + this.colorRate) % 1.0);
    } else if (eyesy.knob4 > 0.5) {
      let colorVal = 1 - eyesy.knob4 * 2;
      colorVal = Math.max(0.0, Math.min(1.0, colorVal));
      color = eyesy.color_picker(colorVal);
    } else {
      color = eyesy.color_picker(0.5);
    }

    canvas.circle([x1, y + circlebuff + yOff], Math.floor(eyesy.knob3 * circleradmax), color, 0);
    canvas.line([y + circlebuff, x0], [x1, y + circlebuff + yOff], color, 2);
  }
}




