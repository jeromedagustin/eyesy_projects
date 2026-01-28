/**
 * Random features manager (random sequence, color, trigger)
 */
import { EYESYImpl } from '../../core/EYESY';
import { Controls } from '../../ui/Controls';

export interface RandomFeaturesState {
  randomSequenceEnabled: boolean;
  randomSequenceTime: number;
  randomSequenceFrequency: number;
  randomColorEnabled: boolean;
  randomColorTime: number;
  randomColorFrequency: number;
  randomTriggerEnabled: boolean;
  randomTriggerTime: number;
  randomTriggerFrequency: number;
  lastRandomTriggerTime: number;
  randomTriggerJustFired: boolean;
  randomVisualTransformEnabled: boolean;
  randomVisualTransformTime: number;
  randomVisualTransformFrequency: number;
  knob1Locked: boolean;
  knob2Locked: boolean;
  knob3Locked: boolean;
  knob4Locked: boolean;
  knob5Locked: boolean;
  knob6Locked: boolean;
  knob7Locked: boolean;
  knob9Locked: boolean;
  knob10Locked: boolean;
}

export class RandomFeatures {
  // State is passed by reference - mutations will affect the original object
  private state: RandomFeaturesState;
  private eyesy: EYESYImpl;
  private controls: Controls;
  private pendingKnobUpdates: Map<number, number>;

  constructor(
    state: RandomFeaturesState,
    eyesy: EYESYImpl,
    controls: Controls,
    pendingKnobUpdates: Map<number, number>
  ) {
    // Store reference to state object (mutations will affect original)
    this.state = state;
    this.eyesy = eyesy;
    this.controls = controls;
    this.pendingKnobUpdates = pendingKnobUpdates;
  }

  update(deltaSeconds: number): void {
    // Random sequence mode (Knobs 1-3)
    if (this.state.randomSequenceEnabled) {
      this.state.randomSequenceTime += deltaSeconds;
      // Frequency controls how often values change
      // 0.0 = very slow (5-7 seconds), 1.0 = very fast (0.5-1.5 seconds)
      const minInterval = 0.5 + (1.0 - this.state.randomSequenceFrequency) * 4.5; // 0.5 to 5.0 seconds
      const maxInterval = 1.5 + (1.0 - this.state.randomSequenceFrequency) * 5.5; // 1.5 to 7.0 seconds
      const interval = minInterval + Math.random() * (maxInterval - minInterval);
      
      if (this.state.randomSequenceTime >= interval) {
        if (!this.state.knob1Locked) {
          this.eyesy.knob1 = Math.random();
          this.pendingKnobUpdates.set(1, this.eyesy.knob1);
        }
        if (!this.state.knob2Locked) {
          this.eyesy.knob2 = Math.random();
          this.pendingKnobUpdates.set(2, this.eyesy.knob2);
        }
        if (!this.state.knob3Locked) {
          this.eyesy.knob3 = Math.random();
          this.pendingKnobUpdates.set(3, this.eyesy.knob3);
        }
        this.state.randomSequenceTime = 0;
      }
    }

    // Random color mode (Knobs 4-5)
    if (this.state.randomColorEnabled) {
      this.state.randomColorTime += deltaSeconds;
      // Frequency controls how often colors change
      // 0.0 = very slow (3-5 seconds), 1.0 = very fast (0.5-1.5 seconds)
      const minInterval = 0.5 + (1.0 - this.state.randomColorFrequency) * 2.5; // 0.5 to 3.0 seconds
      const maxInterval = 1.5 + (1.0 - this.state.randomColorFrequency) * 3.5; // 1.5 to 5.0 seconds
      const interval = minInterval + Math.random() * (maxInterval - minInterval);
      
      if (this.state.randomColorTime >= interval) {
        // Generate random colors ensuring they're never equal
        // Minimum color distance threshold for visibility (RGB distance)
        const minColorDistance = 30;
        let attempts = 0;
        const maxAttempts = 20; // Prevent infinite loops
        
        // Generate new values for unlocked knobs
        if (!this.state.knob4Locked) {
          this.eyesy.knob4 = Math.random();
        }
        if (!this.state.knob5Locked) {
          this.eyesy.knob5 = Math.random();
        }
        
        // Check if colors are too similar and adjust if needed
        let fgColor = this.eyesy.color_picker(this.eyesy.knob4);
        let bgColor = this.eyesy.color_picker(this.eyesy.knob5);
        let colorDistance = Math.sqrt(
          Math.pow(fgColor[0] - bgColor[0], 2) +
          Math.pow(fgColor[1] - bgColor[1], 2) +
          Math.pow(fgColor[2] - bgColor[2], 2)
        );
        
        // If colors are too similar, adjust the unlocked knob(s) to be different
        while (colorDistance < minColorDistance && attempts < maxAttempts) {
          attempts++;
          
          // If both knobs are locked, we can't change them (shouldn't happen in random mode)
          if (this.state.knob4Locked && this.state.knob5Locked) {
            break;
          }
          
          // Adjust the unlocked knob(s) to create contrast
          if (this.state.knob4Locked && !this.state.knob5Locked) {
            // Knob4 is locked, adjust knob5 to be different
            // Try opposite hue on color wheel for maximum contrast
            const lockedHue = (this.eyesy.knob4 / 0.85) * 360;
            const oppositeHue = (lockedHue + 180) % 360;
            this.eyesy.knob5 = (oppositeHue / 360) * 0.85;
          } else if (this.state.knob5Locked && !this.state.knob4Locked) {
            // Knob5 is locked, adjust knob4 to be different
            const lockedHue = (this.eyesy.knob5 / 0.85) * 360;
            const oppositeHue = (lockedHue + 180) % 360;
            this.eyesy.knob4 = (oppositeHue / 360) * 0.85;
          } else {
            // Both unlocked - try random again, or set to contrasting colors
            if (attempts < 10) {
              // Try a few more random attempts
              this.eyesy.knob4 = Math.random();
              this.eyesy.knob5 = Math.random();
            } else {
              // Force contrasting colors after too many attempts
              this.eyesy.knob4 = 0.0; // Red
              this.eyesy.knob5 = 0.66; // Blue
            }
          }
          
          // Recalculate color distance
          fgColor = this.eyesy.color_picker(this.eyesy.knob4);
          bgColor = this.eyesy.color_picker(this.eyesy.knob5);
          colorDistance = Math.sqrt(
            Math.pow(fgColor[0] - bgColor[0], 2) +
            Math.pow(fgColor[1] - bgColor[1], 2) +
            Math.pow(fgColor[2] - bgColor[2], 2)
          );
        }
        
        // Update UI controls
        if (!this.state.knob4Locked) {
          this.controls.updateKnobValue(4, this.eyesy.knob4);
        }
        if (!this.state.knob5Locked) {
          this.controls.updateKnobValue(5, this.eyesy.knob5);
        }
        this.state.randomColorTime = 0;
      }
    }

    // Random visual transform mode (Knobs 6, 7, 9, 10)
    if (this.state.randomVisualTransformEnabled) {
      this.state.randomVisualTransformTime += deltaSeconds;
      // Frequency controls how often values change
      // 0.0 = very slow (5-7 seconds), 1.0 = very fast (0.5-1.5 seconds)
      const minInterval = 0.5 + (1.0 - this.state.randomVisualTransformFrequency) * 4.5; // 0.5 to 5.0 seconds
      const maxInterval = 1.5 + (1.0 - this.state.randomVisualTransformFrequency) * 5.5; // 1.5 to 7.0 seconds
      const interval = minInterval + Math.random() * (maxInterval - minInterval);
      
      if (this.state.randomVisualTransformTime >= interval) {
        if (!this.state.knob6Locked) {
          this.eyesy.knob6 = Math.random();
          this.pendingKnobUpdates.set(6, this.eyesy.knob6);
        }
        if (!this.state.knob7Locked) {
          this.eyesy.knob7 = Math.random();
          this.pendingKnobUpdates.set(7, this.eyesy.knob7);
        }
        if (!this.state.knob9Locked) {
          this.eyesy.knob9 = Math.random();
          this.pendingKnobUpdates.set(9, this.eyesy.knob9);
        }
        if (!this.state.knob10Locked) {
          this.eyesy.knob10 = Math.random();
          this.pendingKnobUpdates.set(10, this.eyesy.knob10);
        }
        this.state.randomVisualTransformTime = 0;
      }
    }

    // Random trigger mode
    this.state.randomTriggerJustFired = false;
    if (this.state.randomTriggerEnabled) {
      this.state.randomTriggerTime += deltaSeconds;
      // Frequency controls how often trigger fires
      // 0.0 = very slow (3-5 seconds), 1.0 = very fast (0.1-0.5 seconds)
      const minInterval = 0.1 + (1.0 - this.state.randomTriggerFrequency) * 2.9; // 0.1 to 3.0 seconds
      const maxInterval = 0.5 + (1.0 - this.state.randomTriggerFrequency) * 4.5; // 0.5 to 5.0 seconds
      const interval = minInterval + Math.random() * (maxInterval - minInterval);
      
      if (this.state.randomTriggerTime >= interval) {
        // Always trigger (positive pulse) - don't randomly turn off
        this.eyesy.trig = true;
        this.state.randomTriggerTime = 0;
        this.state.lastRandomTriggerTime = 0; // Reset time since last trigger
        this.state.randomTriggerJustFired = true;
      } else {
        // Update time since last trigger
        this.state.lastRandomTriggerTime += deltaSeconds;
      }
      
      // Update visual indicator
      const timeSinceLastTrigger = this.state.lastRandomTriggerTime;
      this.controls.updateRandomTriggerActivity(this.state.randomTriggerJustFired, timeSinceLastTrigger);
    } else {
      // Reset indicator when disabled
      this.controls.updateRandomTriggerActivity(false, 999);
    }
  }

  getRandomTriggerJustFired(): boolean {
    return this.state.randomTriggerJustFired;
  }
}
