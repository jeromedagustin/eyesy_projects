import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Surf Waves
 * Ported from Python version
 * 
 * Knob1 - Wave speed
 * Knob2 - Wave size/scale
 * Knob3 - 2D/3D mode switch (0-0.5: 2D waves, 0.5-1: 3D waves) + Wave direction/frequency
 * Knob4 - Foreground color (wave color)
 * Knob5 - Background color (sky color)
 * 
 * Trigger - Creates a "big wave" splash effect at a random horizontal position
 */
interface TriggerWave {
  x: number;
  time: number;
  life: number;
}

export class Surfwaves implements Mode {
  private triggerWaves: TriggerWave[] = [];
  private lastTriggerState = false;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.triggerWaves = [];
    this.lastTriggerState = false;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Get background (sky) color
    const bgColor = eyesy.color_picker_bg(eyesy.knob5);
    canvas.fill(bgColor);
    
    // Handle trigger events - create big wave splash (only on rising edge)
    if (eyesy.trig && !this.lastTriggerState) {
      // Create a new trigger wave at random position
      const triggerX = (0.2 + Math.random() * 0.6) * eyesy.xres; // Random position across screen
      this.triggerWaves.push({
        x: triggerX,
        time: eyesy.time,
        life: 0.0
      });
    }
    // Update last trigger state
    this.lastTriggerState = eyesy.trig;
    
    // Get wave color
    const waveColor = eyesy.color_picker(eyesy.knob4);
    
    // Get audio amplitude for reactivity
    let audioAmplitude = 0.0;
    let audioPeak = 0.0;
    const audioSamplesUsed: number[] = [];
    
    if (eyesy.audio_in.length > 0) {
      // Calculate average amplitude
      let total = 0.0;
      for (let i = 0; i < eyesy.audio_in.length; i++) {
        const absVal = Math.abs(eyesy.audio_in[i]);
        total += absVal;
        if (absVal > audioPeak) {
          audioPeak = absVal;
        }
      }
      audioAmplitude = (total / eyesy.audio_in.length) / 32768.0;
      audioPeak = audioPeak / 32768.0;
      // Store normalized samples for direct wave shaping
      for (let i = 0; i < Math.min(eyesy.audio_in.length, 200); i++) {
        audioSamplesUsed.push(eyesy.audio_in[i] / 32768.0);
      }
    }
    
    // Wave parameters
    let waveSpeed = eyesy.knob1 * 0.02 + 0.003;
    let waveScale = eyesy.knob2 * 2.5 + 0.5;
    
    // Audio reactivity adds dynamic variation
    const speedMod = audioAmplitude * 0.015;
    waveSpeed += speedMod;
    const audioScaleMod = audioAmplitude * 1.0;
    waveScale += audioScaleMod;
    
    // Knob3 controls 2D/3D mode switch and direction
    const use3D = eyesy.knob3 >= 0.5;
    const modeBlend = use3D ? (eyesy.knob3 - 0.5) * 2.0 : 0.0;
    
    let waveDirection: number;
    let breakingIntensity: number;
    let waveFrequency: number;
    
    if (!use3D) {
      // 2D mode: knob3 controls direction and frequency
      if (eyesy.knob3 < 0.25) {
        waveDirection = -1; // Left
        breakingIntensity = (0.25 - eyesy.knob3) * 4.0;
        waveFrequency = 0.5 + (0.25 - eyesy.knob3) * 3.0;
      } else {
        waveDirection = 1; // Right
        breakingIntensity = (eyesy.knob3 - 0.25) * 4.0;
        waveFrequency = 0.5 + (eyesy.knob3 - 0.25) * 3.0;
      }
    } else {
      // 3D mode: knob3 controls direction and frequency
      if (eyesy.knob3 < 0.75) {
        waveDirection = -1; // Left
        breakingIntensity = (0.75 - eyesy.knob3) * 4.0;
        waveFrequency = 1.0 + (0.75 - eyesy.knob3) * 1.5;
      } else {
        waveDirection = 1; // Right
        breakingIntensity = (eyesy.knob3 - 0.75) * 4.0;
        waveFrequency = 1.0 + (eyesy.knob3 - 0.75) * 1.5;
      }
    }
    
    const currentTime = eyesy.time;
    const numLayers = 3;
    
    // Draw waves in 2D or 3D mode based on knob3
    if (use3D) {
      this.draw3DWaves(canvas, eyesy, waveColor, bgColor, waveSpeed, waveScale, waveFrequency, audioAmplitude, currentTime, modeBlend, waveDirection, audioSamplesUsed);
    } else {
      this.draw2DWaves(canvas, eyesy, waveColor, waveSpeed, waveScale, waveDirection, breakingIntensity, waveFrequency, audioAmplitude, currentTime, numLayers, audioSamplesUsed);
    }
    
    // Draw trigger wave effects (big wave splashes)
    this.drawTriggerWaves(canvas, eyesy, waveColor, currentTime);
  }

  private draw2DWaves(
    canvas: Canvas,
    eyesy: EYESY,
    waveColor: [number, number, number],
    waveSpeed: number,
    waveScale: number,
    waveDirection: number,
    breakingIntensity: number,
    waveFrequency: number,
    audioAmplitude: number,
    currentTime: number,
    numLayers: number,
    audioSamplesUsed: number[]
  ): void {
    // Draw wave layers from back to front
    for (let layer = 0; layer < numLayers; layer++) {
      const layerProgress = layer / Math.max(numLayers - 1, 1);
      // Wave properties vary by depth
      const layerSpeed = waveSpeed * (0.4 + layerProgress * 0.6);
      const layerScale = waveScale * (0.5 + layerProgress * 0.5);
      // Wave frequency affects wavelength
      const baseWavelength = 200 + layerProgress * 150;
      const layerWavelength = baseWavelength / waveFrequency;
      // Color gets lighter as waves get closer
      const depthFactor = 0.4 + layerProgress * 0.6;
      const layerColor: [number, number, number] = [
        Math.floor(waveColor[0] * depthFactor),
        Math.floor(waveColor[1] * depthFactor),
        Math.floor(waveColor[2] * depthFactor)
      ];
      const waveOffset = currentTime * layerSpeed * 150 * waveDirection;
      // Adjust base position
      const baseYOffset = (waveScale - 0.5) * 0.4;
      const baseY = eyesy.yres * (0.30 - baseYOffset + layerProgress * (0.55 + baseYOffset * 0.6));
      
      // Build wave points
      const points: [number, number][] = [];
      for (let x = 0; x < eyesy.xres; x++) {
        // Primary wave
        const phase1 = (x / layerWavelength) * 2 * Math.PI + waveOffset;
        const primaryWave = Math.sin(phase1) * 0.7 + Math.cos(phase1) * 0.3;
        // Secondary waves
        const phase2 = (x / (layerWavelength * 1.3)) * 2 * Math.PI + waveOffset * 0.95;
        const phase3 = (x / (layerWavelength * 0.8)) * 2 * Math.PI + waveOffset * 1.05;
        const secondary1 = Math.sin(phase2) * 0.15;
        const secondary2 = Math.cos(phase3) * 0.1;
        
        let waveValue: number;
        if (primaryWave > 0) {
          waveValue = primaryWave * (1.0 + breakingIntensity * 0.2);
        } else {
          waveValue = primaryWave * 0.85;
        }
        waveValue = waveValue + secondary1 + secondary2;
        const subtleVariation = Math.sin(phase1 * 3.5) * 0.015;
        waveValue += subtleVariation;
        
        // Apply wave height scaling
        let baseHeight = waveValue * layerScale * 100;
        
        // Enhanced audio reactivity
        if (audioSamplesUsed.length > 0) {
          const audioIndex = Math.min(Math.floor((x / eyesy.xres) * audioSamplesUsed.length), audioSamplesUsed.length - 1);
          const audioSample = audioSamplesUsed[audioIndex];
          const audioMod = audioSample * layerScale * 150;
          const amplitudeMod = audioAmplitude * layerScale * 80;
          baseHeight = baseHeight + audioMod + amplitudeMod;
        } else {
          const audioMod = audioAmplitude * 20 * Math.sin(phase1 * 1.5);
          baseHeight = baseHeight * (1.0 + audioAmplitude * 0.25) + audioMod;
        }
        
        const yScreen = Math.floor(baseY + baseHeight);
        const xScreen = Math.max(0, Math.min(x, eyesy.xres - 1));
        const yScreenClamped = Math.max(0, Math.min(yScreen, eyesy.yres - 1));
        points.push([xScreen, yScreenClamped]);
      }
      
      // Draw wave as filled polygon
      if (points.length > 1) {
        const polygonPoints: [number, number][] = [[0, eyesy.yres]];
        polygonPoints.push(...points);
        polygonPoints.push([eyesy.xres - 1, eyesy.yres]);
        // Ensure all y values are within screen bounds
        const safePoints = polygonPoints.map(([px, py]) => [px, Math.min(eyesy.yres - 1, Math.max(0, py))] as [number, number]);
        canvas.polygon(safePoints, layerColor, 0);
      }
      
      // Draw wave details on top layer
      if (layer === numLayers - 1) {
        // Draw subtle wave crest highlight
        if (points.length > 1) {
          const crestColor: [number, number, number] = [
            Math.min(255, layerColor[0] + 20),
            Math.min(255, layerColor[1] + 20),
            Math.min(255, layerColor[2] + 20)
          ];
          canvas.lines(points, crestColor, 1);
        }
      }
    }
  }

  private draw3DWaves(
    canvas: Canvas,
    eyesy: EYESY,
    waveColor: [number, number, number],
    bgColor: [number, number, number],
    waveSpeed: number,
    waveScale: number,
    waveFrequency: number,
    audioAmplitude: number,
    currentTime: number,
    modeBlend: number,
    waveDirection: number,
    audioSamplesUsed: number[]
  ): void {
    // 3D parameters
    const numRows = 25;
    const numCols = 60;
    const depthRange = 600.0;
    const cameraZ = -150.0;
    const focalLength = 400.0;
    
    // Wave parameters
    const waveOffsetX = currentTime * waveSpeed * 150 * waveDirection;
    const waveOffsetZ = currentTime * waveSpeed * 100;
    
    // Generate 3D wave mesh
    const screenPoints: ([number, number] | null)[][] = [];
    
    for (let row = 0; row < numRows; row++) {
      const z3d = row * (depthRange / numRows);
      const depthFactor = 1.0 - (z3d / depthRange);
      const colorFactor = 0.3 + depthFactor * 0.7;
      const rowColor: [number, number, number] = [
        Math.floor(waveColor[0] * colorFactor),
        Math.floor(waveColor[1] * colorFactor),
        Math.floor(waveColor[2] * colorFactor)
      ];
      
      const rowScreenPoints: ([number, number] | null)[] = [];
      
      for (let col = 0; col < numCols; col++) {
        const x3d = (col / (numCols - 1)) * eyesy.xres * 1.2 - (eyesy.xres * 1.2) / 2;
        
        // Calculate wave height
        const phaseX = (x3d / (200.0 / waveFrequency)) * 2 * Math.PI + waveOffsetX;
        const phaseZ = (z3d / (150.0 / waveFrequency)) * 2 * Math.PI + waveOffsetZ;
        const waveX = Math.sin(phaseX) * 0.7 + Math.cos(phaseX) * 0.3;
        const waveZ = Math.sin(phaseZ) * 0.5 + Math.cos(phaseZ * 0.7) * 0.3;
        let waveHeight3d = (waveX + waveZ * 0.5) * waveScale * 150;
        
        // Enhanced audio reactivity
        if (audioSamplesUsed.length > 0) {
          const audioIndex = Math.min(Math.floor((col / numCols) * audioSamplesUsed.length), audioSamplesUsed.length - 1);
          const audioSample = audioSamplesUsed[audioIndex];
          const audioMod = audioSample * waveScale * 200;
          const amplitudeMod = audioAmplitude * waveScale * 100;
          waveHeight3d = waveHeight3d + audioMod + amplitudeMod;
        } else {
          const audioMod = audioAmplitude * 25 * Math.sin(phaseX * 1.5);
          waveHeight3d = waveHeight3d * (1.0 + audioAmplitude * 0.4) + audioMod;
        }
        
        const y3d = waveHeight3d;
        const baseY3d = eyesy.yres * (0.20 + (1.0 - depthFactor) * 0.5);
        const finalY3d = y3d + baseY3d;
        
        // Project 3D to 2D
        const zDistance = z3d - cameraZ;
        if (zDistance > 0) {
          const screenX = (x3d * focalLength) / zDistance + eyesy.xres / 2;
          const screenY = (finalY3d * focalLength) / zDistance + eyesy.yres * 0.1;
          rowScreenPoints.push([Math.floor(screenX), Math.floor(screenY)]);
        } else {
          rowScreenPoints.push(null);
        }
      }
      screenPoints.push(rowScreenPoints);
    }
    
    // Draw 3D wave mesh as filled polygons
    for (let row = 0; row < numRows - 1; row++) {
      const z3d = row * (depthRange / numRows);
      const depthFactor = 1.0 - (z3d / depthRange);
      const colorFactor = 0.3 + depthFactor * 0.7;
      const rowColor: [number, number, number] = [
        Math.floor(waveColor[0] * colorFactor),
        Math.floor(waveColor[1] * colorFactor),
        Math.floor(waveColor[2] * colorFactor)
      ];
      
      // Draw quads between this row and next row
      for (let col = 0; col < numCols - 1; col++) {
        const p1 = screenPoints[row][col];
        const p2 = screenPoints[row][col + 1];
        const p3 = screenPoints[row + 1][col + 1];
        const p4 = screenPoints[row + 1][col];
        
        if (p1 && p2 && p3 && p4) {
          // Quick visibility check
          const minX = Math.min(p1[0], p2[0], p3[0], p4[0]);
          const maxX = Math.max(p1[0], p2[0], p3[0], p4[0]);
          const minY = Math.min(p1[1], p2[1], p3[1], p4[1]);
          const maxY = Math.max(p1[1], p2[1], p3[1], p4[1]);
          
          if (maxX < 0 || minX >= eyesy.xres || maxY < 0 || minY >= eyesy.yres) {
            continue;
          }
          
          // Clamp points to screen bounds
          const safeQuadPoints: [number, number][] = [
            [Math.max(0, Math.min(p1[0], eyesy.xres - 1)), Math.max(0, Math.min(p1[1], eyesy.yres - 1))],
            [Math.max(0, Math.min(p2[0], eyesy.xres - 1)), Math.max(0, Math.min(p2[1], eyesy.yres - 1))],
            [Math.max(0, Math.min(p3[0], eyesy.xres - 1)), Math.max(0, Math.min(p3[1], eyesy.yres - 1))],
            [Math.max(0, Math.min(p4[0], eyesy.xres - 1)), Math.max(0, Math.min(p4[1], eyesy.yres - 1))]
          ];
          
          canvas.polygon(safeQuadPoints, rowColor, 0);
        }
      }
    }
  }

  private drawTriggerWaves(
    canvas: Canvas,
    eyesy: EYESY,
    waveColor: [number, number, number],
    currentTime: number
  ): void {
    // Update and draw trigger waves
    const activeWaves: TriggerWave[] = [];
    
    for (const wave of this.triggerWaves) {
      wave.life = currentTime - wave.time;
      const maxLife = 3.0;
      
      if (wave.life < maxLife) {
        activeWaves.push(wave);
        const lifeRatio = wave.life / maxLife;
        const maxRadius = eyesy.xres * 0.8;
        const currentRadius = lifeRatio * maxRadius;
        const numRipples = 5;
        const rippleSpacing = maxRadius / numRipples;
        
        for (let rippleNum = 0; rippleNum < numRipples; rippleNum++) {
          const rippleRadius = currentRadius - (rippleNum * rippleSpacing);
          if (rippleRadius > 0 && rippleRadius < maxRadius) {
            const distanceFactor = 1.0 - (rippleRadius / maxRadius);
            const timeFactor = 1.0 - lifeRatio;
            const amplitude = distanceFactor * timeFactor * 80;
            const frequency = 3.0 + rippleNum * 0.5;
            
            const points: [number, number][] = [];
            const numPoints = Math.floor(eyesy.xres * 0.8);
            
            for (let i = 0; i < numPoints; i++) {
              const x = wave.x - maxRadius / 2 + (i / numPoints) * maxRadius;
              if (x >= 0 && x < eyesy.xres) {
                const distFromCenter = Math.abs(x - wave.x);
                const phase = (distFromCenter / rippleSpacing) * 2 * Math.PI - (lifeRatio * frequency * 2 * Math.PI);
                const waveHeight = Math.sin(phase) * amplitude * (1.0 - lifeRatio);
                const baseY = eyesy.yres * 0.5;
                const y = Math.max(0, Math.min(eyesy.yres - 1, Math.floor(baseY + waveHeight)));
                points.push([Math.floor(x), y]);
              }
            }
            
            if (points.length > 1) {
              const colorFactor = (1.0 - lifeRatio) * (1.0 - rippleRadius / maxRadius) * 0.8;
              const rippleColor: [number, number, number] = [
                Math.floor(waveColor[0] * (0.5 + colorFactor * 0.5)),
                Math.floor(waveColor[1] * (0.5 + colorFactor * 0.5)),
                Math.floor(waveColor[2] * (0.5 + colorFactor * 0.5))
              ];
              const lineWidth = Math.max(1, Math.floor(3 * (1.0 - lifeRatio)));
              canvas.lines(points, rippleColor, lineWidth);
            }
          }
        }
        
        // Draw central impact point
        if (lifeRatio < 0.15) {
          const impactSize = Math.floor((1.0 - lifeRatio / 0.15) * 15);
          if (impactSize > 0) {
            const impactColor: [number, number, number] = [
              Math.min(255, waveColor[0] + 40),
              Math.min(255, waveColor[1] + 40),
              Math.min(255, waveColor[2] + 40)
            ];
            const impactY = Math.floor(eyesy.yres * 0.5);
            canvas.circle([Math.floor(wave.x), impactY], impactSize, impactColor, 0);
          }
        }
      }
    }
    
    this.triggerWaves = activeWaves;
  }
}
