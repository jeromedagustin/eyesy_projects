import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { createFont, renderText, Font } from '../../core/FontRenderer';

/**
 * U - Timer
 * Ported from Python version
 * 
 * Knob1 - hours (0-23)
 * Knob2 - minutes (0-59)
 * Knob3 - seconds (0-59)
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Timer implements Mode {
  private xr = 1280;
  private yr = 720;
  private font: Font | null = null;
  private font2: Font | null = null;
  private countdownActive = false;
  private lastTrigTime = 0;
  private timeOfStart = 0;
  private messageStartTime = 0;
  private fullDuration = 0;
  private hours = 0;
  private minutes = 0;
  private seconds = 0;
  private phraseList = [
    "Yes!", "Looks good", "Sounds good!", "Turn it up", "Elemental!", "Badass", "Word", "Realness",
    "Your goals", "New", "&", "Increase", "Up", "Trajectory", "Phase it", "In it", "Keep going",
    "Awesome", "Next level", "Boost", "Energy", "Vibe", "Positive", "Momentum", "Flow", "Rhythm",
    "Synergy", "Harmony", "Balance", "Focus", "Drive", "Motivation", "Inspiration", "Creativity",
    "Innovation", "Progress", "Growth", "Development", "Evolution", "Let it echo", "Transformation", "Breakthrough",
    "Milestone", "Achievement", "Success", "Victory", "Triumph", "Accomplishment", "Fulfillment",
    "Satisfaction", "Happiness", "Joy", "Excitement", "Enthusiasm", "Passion", "Dedication",
    "Commitment", "Determination", "Resilience", "Strength", "Courage", "Confidence", "Belief",
    "Fun", "Hope", "Optimism", "Gratitude", "Appreciation", "Respect", "Integrity", "Honesty",
    "Trust", "Loyalty", "Support", "Encouragement", "Empathy", "Compassion", "Kindness", "Generosity",
    "Humility", "Patience", "Wisdom", "Knowledge", "Understanding", "Insight", "Clarity", "Vision",
    "Purpose", "Mission", "Values", "Principles", "Standards", "Quality", "Excellence", "Perfection",
    "Precision", "Accuracy", "Efficiency", "Effectiveness", "Productivity", "Impact", "Agreement",
    "Aptitude", "Authenticity", "Blend", "Hybrid", "Technique", "Endeavor"
  ];
  private currentPhrase = "";
  private phraseStartTime = 0;
  private phrasePosition: [number, number] = [0, 0];
  private phraseSpeed = 0;
  private phraseDestination: [number, number] = [0, 0];
  private phraseHistory: string[] = [];

  setup(_canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.font = createFont('', Math.floor(this.yr / 5));
    this.font2 = createFont('', Math.floor(this.yr / 11));
    this.countdownActive = false;
    this.lastTrigTime = 0;
    this.timeOfStart = 0;
    this.messageStartTime = 0;
    this.fullDuration = 0;
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.currentPhrase = "";
    this.phraseStartTime = 0;
    this.phrasePosition = [0, 0];
    this.phraseSpeed = 0;
    this.phraseDestination = [0, 0];
    this.phraseHistory = [];
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    const currentTime = eyesy.time;
    
    if (eyesy.trig) {
      if (currentTime - this.lastTrigTime < 0.5) {
        // Double trigger - stop countdown
        this.countdownActive = false;
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
        this.fullDuration = 0;
      } else {
        if (this.countdownActive) {
          this.countdownActive = false; // Stop the countdown
        } else {
          this.countdownActive = true; // Start the countdown
          this.fullDuration = this.hours * 3600 + this.minutes * 60 + this.seconds;
          this.timeOfStart = currentTime;
          this.messageStartTime = currentTime;
          this.phraseStartTime = 0;
        }
      }
      this.lastTrigTime = currentTime;
    }
    
    // Update the countdown time from knobs if the countdown is not active
    if (!this.countdownActive) {
      this.hours = Math.floor(eyesy.knob1 * 23);
      this.minutes = Math.floor(eyesy.knob2 * 59);
      this.seconds = Math.floor(eyesy.knob3 * 59);
    }
    
    if (this.countdownActive) {
      const elapsedTime = currentTime - this.timeOfStart;
      const remainingSeconds = Math.max(0, this.fullDuration - Math.floor(elapsedTime));
      this.hours = Math.floor(remainingSeconds / 3600);
      this.minutes = Math.floor((remainingSeconds % 3600) / 60);
      this.seconds = remainingSeconds % 60;
      
      if (remainingSeconds === 0) {
        this.countdownActive = false;
      }
      
      // Screen flashing logic
      if (10 < remainingSeconds && remainingSeconds <= 30) {
        if (Math.floor(currentTime) % 2 === 0) {
          canvas.fill([0, 0, 0]); // Fill screen with black
        } else {
          canvas.fill([255, 255, 255]); // Fill screen with white
        }
      } else if (remainingSeconds > 0 && remainingSeconds <= 10) {
        if (Math.floor(currentTime * 2) % 2 === 0) {
          canvas.fill([0, 0, 0]); // Fill screen with black
        } else {
          canvas.fill([255, 255, 255]); // Fill screen with white
        }
      }
      
      // Handle phrase movement
      if (this.fullDuration > 45) {
        if (this.phraseStartTime === 0 || (currentTime - this.phraseStartTime > (8 + Math.random() * 7))) {
          // Ensure the current phrase is not one of the last 47 phrases
          while (true) {
            this.currentPhrase = this.phraseList[Math.floor(Math.random() * this.phraseList.length)];
            if (!this.phraseHistory.includes(this.currentPhrase)) {
              break;
            }
          }
          this.phraseHistory.push(this.currentPhrase);
          if (this.phraseHistory.length > 47) {
            this.phraseHistory.shift();
          }
          this.phraseSpeed = 0.5 + Math.random() * 2.5; // Random speed in pixels per second
          
          // Random starting position outside the screen boundaries
          const startSide = ['left', 'right', 'top', 'bottom'][Math.floor(Math.random() * 4)];
          if (startSide === 'left') {
            this.phrasePosition = [-this.xr / 4, Math.random() * this.yr];
            this.phraseDestination = [this.xr + this.xr / 4, this.phrasePosition[1]];
          } else if (startSide === 'right') {
            this.phrasePosition = [this.xr + this.xr / 4, Math.random() * this.yr];
            this.phraseDestination = [-this.xr / 4, this.phrasePosition[1]];
          } else if (startSide === 'top') {
            this.phrasePosition = [Math.random() * this.xr * 0.85, -this.yr / 5];
            this.phraseDestination = [this.phrasePosition[0], this.yr + this.yr / 5];
          } else if (startSide === 'bottom') {
            this.phrasePosition = [Math.random() * this.xr * 0.85, this.yr + this.yr / 5];
            this.phraseDestination = [this.phrasePosition[0], -this.yr / 5];
          }
          this.phraseStartTime = currentTime;
        }
        
        // Move the phrase
        const elapsedTimeSinceStart = currentTime - this.phraseStartTime;
        const distance = this.phraseSpeed * elapsedTimeSinceStart;
        const totalDistance = Math.sqrt(
          Math.pow(this.phraseDestination[0] - this.phrasePosition[0], 2) +
          Math.pow(this.phraseDestination[1] - this.phrasePosition[1], 2)
        );
        
        if (distance < totalDistance) {
          const ratio = distance / totalDistance;
          this.phrasePosition[0] = this.phrasePosition[0] + ratio * (this.phraseDestination[0] - this.phrasePosition[0]);
          this.phrasePosition[1] = this.phrasePosition[1] + ratio * (this.phraseDestination[1] - this.phrasePosition[1]);
        } else {
          this.phraseStartTime = 0; // Reset to pick a new phrase
        }
        
        // Render the phrase only if there are more than 30 seconds remaining
        if (remainingSeconds > 30 && this.currentPhrase) {
          const phraseRender = renderText(this.font2!, this.currentPhrase, false, color);
          canvas.blitText(phraseRender.texture, this.phrasePosition[0], this.phrasePosition[1], false, false);
        }
      }
    }
    
    // Render time digits
    const digit = this.xr * 0.04;
    const halfLine = digit * 4;
    const timeStr = `${this.hours.toString().padStart(2, '0')}:${this.minutes.toString().padStart(2, '0')}:${this.seconds.toString().padStart(2, '0')}`;
    
    const digitPositions: [number, number][] = [];
    for (let i = 0; i < 8; i++) {
      digitPositions.push([this.xr / 2 - halfLine + i * digit, this.yr / 2 - this.yr / 8]);
    }
    
    for (let i = 0; i < timeStr.length; i++) {
      const char = timeStr[i];
      const charRender = renderText(this.font!, char, false, color);
      canvas.blitText(charRender.texture, digitPositions[i][0], digitPositions[i][1], false, false);
    }
    
    // Render "Countdown Started" message
    if (this.countdownActive && currentTime - this.messageStartTime < 1.5) {
      const message = renderText(this.font2!, "Countdown Started", false, color);
      const messageX = this.xr / 2;
      const messageY = this.yr / 2 + this.yr / 16;
      canvas.blitText(message.texture, messageX, messageY, true, true); // centerX, centerY
    }
  }
}
