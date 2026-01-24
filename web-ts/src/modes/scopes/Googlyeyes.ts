import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - Googly Eyes
 * Ported from Python version
 * 
 * Knob1 - mouth thickness & eye size
 * Knob2 - mouth width
 * Knob3 - speed of eye bounce
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

export class Googlyeyes implements Mode {
  private lastPoint: [number, number] = [320, 0];
  private lfo1: LFO;
  private lfo2: LFO;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.lfo1 = new LFO(-200, 200, 1);
    this.lfo2 = new LFO(-300, 300, 1);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const xr = eyesy.xres;
    const yr = eyesy.yres;

    // Update LFO bounds
    this.lfo1.start = xr * -0.15625;
    this.lfo1.max = xr * 0.15625;
    this.lfo2.start = xr * -0.234375;
    this.lfo2.max = xr * 0.234375;

    const xhalf = xr * 0.5;
    const x720 = xr * 0.563;
    const x1116 = xr * 0.6875;
    const y3d = yr / 3;
    const y600 = yr * 0.833;
    const y640 = yr * 0.889;
    const color = eyesy.color_picker(eyesy.knob4);
    // Use AudioScope for consistent audio handling
    // Python version uses audio_in[0] / 450, audio_in[1] / 450
    // AudioScope returns normalized (-1 to 1), so multiply by 32768 to get raw, then divide by 450
    const audio1Raw = AudioScope.getSampleClamped(eyesy, 0);
    const audio2Raw = AudioScope.getSampleClamped(eyesy, 1);
    const audio1 = (audio1Raw * 32768) / 450;
    const audio2 = (audio2Raw * 32768) / 450;
    const widthmod = xr * 0.098;
    const linewidth = Math.floor(eyesy.knob1 * widthmod) + 1;

    // Draw mouth
    for (let i = 0; i < 100; i++) {
      const xscale = (xhalf / 99) * i;
      const xoffset = Math.floor(xhalf + xscale) * eyesy.knob2 * i / 100 + (x720 - eyesy.knob2 * xhalf);
      // Python version uses audio_in[2] / y640
      const audio2Raw = AudioScope.getSampleClamped(eyesy, 2);
      const audio2Val = (audio2Raw * 32768) / y640;
      const yoffset = y600 - audio2Val;
      // Python version uses audio_in[i] / (500 - knob2 * 499)
      const divisor = 500 - Math.floor(eyesy.knob2 * 499);
      const audioRaw = AudioScope.getSampleClamped(eyesy, i);
      const audio = (audioRaw * 32768) / divisor;
      const mouthColor = eyesy.color_picker_lfo(eyesy.knob4);

      if (i === 0) {
        this.lastPoint = [
          (0 * eyesy.knob2 + -audio) + (x720 - eyesy.knob2 * xhalf),
          yoffset + audio
        ];
      }

      const nextPoint: [number, number] = [xoffset + -audio, yoffset + audio];
      canvas.line(this.lastPoint, nextPoint, mouthColor, linewidth);
      this.lastPoint = nextPoint;
    }

    // Draw eyes
    const radrat = xr * 0.098;
    const rad = Math.floor(eyesy.knob1 * radrat) + 20;
    const xpos1 = (2 * radrat) + audio1;
    const ypos1 = y3d - audio1;
    const xpos2 = x1116 - audio2;
    const ypos2 = y3d - audio2;
    // Python version uses audio_in[20] * 0.0001 and audio_in[25] * 0.0001
    // AudioScope returns normalized (-1 to 1), so multiply by 32768 to get raw value
    const audio20Raw = AudioScope.getSampleClamped(eyesy, 20);
    const audio25Raw = AudioScope.getSampleClamped(eyesy, 25);
    const audio20 = audio20Raw * 32768;
    const audio25 = audio25Raw * 32768;
    const xrad = (rad / 2) * Math.sin(audio20 * 0.0001);
    const yrad = (rad / 2) * Math.cos(audio25 * 0.0001);
    const step1mod = xr * 0.023;
    const step2mod = xr * 0.031;
    this.lfo1.step = eyesy.knob3 * step1mod;
    this.lfo2.step = eyesy.knob3 * step2mod;

    const roll1 = Math.floor(this.lfo1.update());
    const roll2 = -Math.floor(this.lfo1.update());
    const slide1 = Math.floor(this.lfo2.update());
    const slide2 = -Math.floor(this.lfo2.update());

    // Left eye
    canvas.circle([xpos1 + slide1, ypos1 + roll1], rad, color, 0);
    canvas.circle([xpos1 + Math.floor(xrad) + slide1, ypos1 - Math.floor(yrad) + roll1], Math.floor(rad / 2), [245, 200, 255], 0);

    // Right eye
    canvas.circle([xpos2 + slide2, ypos2 + roll2], rad, color, 0);
    canvas.circle([xpos2 + Math.floor(xrad) + slide2, ypos2 - Math.floor(yrad) + roll2], Math.floor(rad / 2), [245, 200, 255], 0);
  }
}
