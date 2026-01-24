import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Mess A Sketch
 * Ported from Python version
 * 
 * Knob1 - x position
 * Knob2 - y position
 * Knob3 - line width
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Messasketch implements Mode {
  private drawing: Array<[[number, number], [number, number, number], number]> = [];
  private currentPos: [[number, number], [number, number, number], number] = [[0, 0], [0, 0, 0], 0];
  private mess = false;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.currentPos = [
      [Math.floor(eyesy.knob1 * eyesy.xres), Math.floor((1 - eyesy.knob2) * eyesy.yres)],
      eyesy.color_picker(eyesy.knob4),
      Math.floor(eyesy.knob3 * 0)
    ];
    this.drawing = [this.currentPos];
    this.mess = false;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Update current position
    const newPos: [[number, number], [number, number, number], number] = [
      [Math.floor(eyesy.knob1 * eyesy.xres), Math.floor((1 - eyesy.knob2) * eyesy.yres)],
      eyesy.color_picker(eyesy.knob4),
      Math.floor(eyesy.knob3 * 30)
    ];
    
    // Check if position changed
    if (this.drawing.length > 0 && 
        this.drawing[this.drawing.length - 1][0][0] === newPos[0][0] &&
        this.drawing[this.drawing.length - 1][0][1] === newPos[0][1]) {
      // Same position, update the last entry
      this.drawing[this.drawing.length - 1] = newPos;
    } else if (this.drawing.length > 0 && 
               (this.drawing[this.drawing.length - 1][0][0] !== newPos[0][0] ||
                this.drawing[this.drawing.length - 1][0][1] !== newPos[0][1]) &&
               Math.floor(eyesy.knob3 * 30) > 0) {
      // Position changed, add new point
      this.drawing.push(newPos);
    }
    
    // Handle trigger - toggle mess mode
    if (eyesy.trig) {
      this.mess = !this.mess;
      
      // Clear drawing if all knobs are at max (special clear condition)
      if (eyesy.knob1 === 1 && eyesy.knob2 === 1 && eyesy.knob3 === 0 && 
          eyesy.knob4 === 1 && eyesy.knob5 === 1) {
        this.drawing = [newPos];
      }
    }
    
    // Draw the path
    if (this.mess) {
      const audioLevel = Math.abs(eyesy.audio_in[0] || 0) / 32767.0;
      const randomOffset = Math.floor(audioLevel * 50);
      
      for (let i = 1; i < this.drawing.length; i++) {
        const prevPoint = this.drawing[i - 1][0];
        const currPoint = this.drawing[i][0];
        const color = this.drawing[i][1];
        const width = this.drawing[i][2];
        
        // Add random offset based on audio
        const startX = prevPoint[0] + Math.floor((Math.random() * 2 - 1) * randomOffset);
        const startY = prevPoint[1] + Math.floor((Math.random() * 2 - 1) * randomOffset);
        const endX = currPoint[0] + Math.floor((Math.random() * 2 - 1) * randomOffset);
        const endY = currPoint[1] + Math.floor((Math.random() * 2 - 1) * randomOffset);
        
        canvas.line([startX, startY], [endX, endY], color, width);
      }
    } else {
      // Normal drawing
      for (let i = 1; i < this.drawing.length; i++) {
        const prevPoint = this.drawing[i - 1][0];
        const currPoint = this.drawing[i][0];
        const color = this.drawing[i][1];
        const width = this.drawing[i][2];
        
        canvas.line(prevPoint, currPoint, color, width);
      }
    }
    
    // Draw current position indicator
    const currentColor = eyesy.color_picker(eyesy.knob4);
    const currentWidth = Math.floor(eyesy.knob3 * 30) + 5;
    const currentX = Math.floor(eyesy.knob1 * eyesy.xres);
    const currentY = Math.floor((1 - eyesy.knob2) * eyesy.yres);
    canvas.line([currentX, currentY], [currentX, currentY], currentColor, currentWidth);
    
    // Update current position
    this.currentPos = newPos;
  }
}
