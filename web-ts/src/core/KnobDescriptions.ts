/**
 * Knob descriptions for each mode
 * These describe what each knob (1-3) does for each animation mode
 * Knob 4 is always "Foreground Color" and Knob 5 is always "Background Color"
 */
import { ModeInfo } from '../ui/ModeSelector';

export const knobDescriptions: Record<string, ModeInfo['knobDescriptions']> = {
  // Scopes
  's---0-arrival-scope': {
    knob1: 'Line Density',
    knob2: 'Line Length',
    knob3: 'Line Spacing',
  },
  's---0-joy-division': {
    knob1: 'Line Count',
    knob2: 'Line Thickness',
    knob3: 'Pattern Variation',
  },
  's---a-zach-reactive': {
    knob1: 'Shape Size',
    knob2: 'Shape Count',
    knob3: 'Reactivity',
  },
  's---a-zach-spiral': {
    knob1: 'Spiral Tightness',
    knob2: 'Spiral Size',
    knob3: 'Rotation Speed',
  },
  's---aa-selector': {
    knob1: 'Number of layers',
    knob2: 'Layer offset',
    knob3: 'Shape selector',
  },
  's---amp-color': {
    knob1: 'Color Intensity',
    knob2: 'Pattern Size',
    knob3: 'Pattern Speed',
  },
  's---aquarium': {
    knob1: 'Number of fish',
    knob2: 'Fish length',
    knob3: 'Line width',
  },
  's---bezier-scope': {
    knob1: 'Curve Complexity',
    knob2: 'Curve Smoothness',
    knob3: 'Point Count',
  },
  's---bezier-scope---filled': {
    knob1: 'Curve Complexity',
    knob2: 'Fill Opacity',
    knob3: 'Point Count',
  },
  's---bezier-scope---outlines': {
    knob1: 'Curve Complexity',
    knob2: 'Line Thickness',
    knob3: 'Point Count',
  },
  's---classic-horizontal': {
    knob1: 'Line Count',
    knob2: 'Line Thickness',
    knob3: 'Smoothing',
  },
  's---classic-vertical': {
    knob1: 'Line Count',
    knob2: 'Line Thickness',
    knob3: 'Smoothing',
  },
  's---gradient-cloud': {
    knob1: 'Cloud X position',
    knob2: 'Cloud Y position',
    knob3: 'Pattern shape and swell range',
  },
  's---rain': {
    knob1: 'Rain Density',
    knob2: 'Rain Speed',
    knob3: 'Rain Length',
  },
  's---snow': {
    knob1: 'Snow Density',
    knob2: 'Snow Speed',
    knob3: 'Snowflake Size',
  },
  's---three-scopes': {
    knob1: 'Scope 1 Size',
    knob2: 'Scope 2 Size',
    knob3: 'Scope 3 Size',
  },
  's---two-scopes': {
    knob1: 'Left Scope Size',
    knob2: 'Right Scope Size',
    knob3: 'Scope Spacing',
  },
  's---xscope': {
    knob1: 'Line width',
    knob2: 'Shadow angle & position',
    knob3: 'Scope angle & position',
  },
  's---zoomscope': {
    knob1: 'Scope points',
    knob2: 'Scope X position',
    knob3: 'Scope Y position',
  },
  's---surf-waves': {
    knob1: 'Wave speed',
    knob2: 'Wave size/scale',
    knob3: '2D/3D mode switch',
  },
  's---breathing-circles': {
    knob1: 'Breathing speed',
    knob2: 'Breathing depth/amplitude',
    knob3: 'Number of concentric circles',
  },
  's---spinning-discs': {
    knob1: 'Rotation rate',
    knob2: 'Image select',
    knob3: 'Index color',
  },
  's---folia-angles': {
    knob1: 'Drawing option selection',
    knob2: 'Max rotation speed',
    knob3: 'Trails amount',
  },
  's---folia-curves': {
    knob1: 'Drawing option selection',
    knob2: 'Max rotation speed',
    knob3: 'Trails amount',
  },
  's---grid-circles-outlined': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of circles',
  },
  's---grid-circles-outlined-column-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of circles',
  },
  's---grid-triangles-filled-uniform-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of triangles',
  },
  's---grid-slide-square-filled-column-color': {
    knob1: 'LFO step amount',
    knob2: 'LFO start position',
    knob3: 'Size of squares',
  },
  's---amp-color---5gon-filled': {
    knob1: 'Audio History',
    knob2: 'Rotation Direction & Rate',
    knob3: 'Nested Polygon Count',
  },
  's---amp-color---5gon-outlines': {
    knob1: 'Audio History',
    knob2: 'Rotation Direction & Rate',
    knob3: 'Nested Polygon Count',
  },
  's---amp-color---circles': {
    knob1: 'Audio History',
    knob2: 'Rotation Direction & Rate',
    knob3: 'Nested Circle Count',
  },
  's---amp-color---rectangles': {
    knob1: 'Audio History',
    knob2: 'Rotation Direction & Speed',
    knob3: 'Number of rectangles',
  },
  's---arcway': {
    knob1: 'Line width/length',
    knob2: 'Rate of rotation',
    knob3: 'Offset of bottom disc',
  },
  's---arcway-black': {
    knob1: 'Line width/length',
    knob2: 'Rate of rotation',
    knob3: 'Offset of bottom disc',
  },
  's---audio-printer': {
    knob1: 'Print direction & quantity',
    knob2: 'Horizontal shift amount',
    knob3: 'Audio level',
  },
  's---bezier-h-scope': {
    knob1: 'Y offset for lines',
    knob2: 'X offset for lines',
    knob3: 'Trails',
  },
  's---bezier-v-scope': {
    knob1: 'X offset for lines',
    knob2: 'Y offset for lines',
    knob3: 'Trails',
  },
  's---bits-horizontal': {
    knob1: 'Number of lines',
    knob2: 'Line length',
    knob3: 'Angle adjustment',
  },
  's---bits-vertical': {
    knob1: 'Number of lines',
    knob2: 'Line length',
    knob3: 'Angle adjustment',
  },
  's---boids': {
    knob1: 'Boid size',
    knob2: 'Bar width',
    knob3: 'Bar style',
  },
  's---bouncing-bars-lfo': {
    knob1: 'Bar size',
    knob2: 'X movement speed',
    knob3: 'Y bounce speed',
  },
  's---breezy-feather-lfo': {
    knob1: 'Rate of change for number of triangles',
    knob2: 'Feather angle',
    knob3: 'Y position step amount',
  },
  's---circle-row---lfo': {
    knob1: 'Number of circles',
    knob2: 'Circle size',
    knob3: 'Y position step amount',
  },
  's---circle-scope---image': {
    knob1: 'Image size/scale',
    knob2: 'Circle radius',
    knob3: 'Line thickness',
  },
  's---circle-scope---opposite-colors': {
    knob1: 'Line & circle sizes',
    knob2: 'Scope diameter',
    knob3: 'Rotation rate',
  },
  's---circular-trigon-field': {
    knob1: 'Diameter/radius',
    knob2: 'Second point position',
    knob3: 'Third point position',
  },
  's---concentric': {
    knob1: 'X position',
    knob2: 'Y position',
    knob3: 'Circle scaler',
  },
  's---dancing-circle---image': {
    knob1: 'Image size',
    knob2: 'Diameter of dance',
    knob3: 'Circle size & fill option',
  },
  's---five-lines-spin': {
    knob1: 'Line rate of rotation & direction',
    knob2: 'Line length',
    knob3: 'Line thickness',
  },
  's---googly-eyes': {
    knob1: 'Mouth thickness & eye size',
    knob2: 'Mouth width',
    knob3: 'Speed of eye bounce',
  },
  's---gradient-column': {
    knob1: 'Cloud height',
    knob2: 'Cloud width',
    knob3: 'Pattern shape and swell range',
  },
  's---gradient-friend': {
    knob1: 'X position',
    knob2: 'Y position',
    knob3: 'Height',
  },
  's---grid-circles---column-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of circles',
  },
  's---grid-circles---outlined': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of circles',
  },
  's---grid-circles---outlined-column-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of circles',
  },
  's---grid-circles---patchwork-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of circles',
  },
  's---grid-circles---uniform-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of circles',
  },
  's---grid-polygons---column-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of polygons',
  },
  's---grid-polygons---patchwork-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of polygons',
  },
  's---grid-polygons---uniform-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of polygons',
  },
  's---grid-slide-square---filled-patchwork-color': {
    knob1: 'LFO step amount',
    knob2: 'LFO start position',
    knob3: 'Size of squares',
  },
  's---grid-slide-square---filled-uniform-color': {
    knob1: 'LFO step amount',
    knob2: 'LFO start position',
    knob3: 'Size of squares',
  },
  's---grid-slide-square---unfilled-column-color': {
    knob1: 'LFO step amount',
    knob2: 'LFO start position',
    knob3: 'Size of squares',
  },
  's---grid-slide-square---unfilled-patchwork-color': {
    knob1: 'LFO step amount',
    knob2: 'LFO start position',
    knob3: 'Size of squares',
  },
  's---grid-slide-square---unfilled-uniform-color': {
    knob1: 'LFO step amount',
    knob2: 'LFO start position',
    knob3: 'Size of squares',
  },
  's---grid-triangles---filled-column-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of triangles',
  },
  's---grid-triangles---filled-patchwork-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of triangles',
  },
  's---grid-triangles---filled-uniform-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of triangles',
  },
  's---grid-triangles---unfilled-column-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of triangles',
  },
  's---grid-triangles---unfilled-patchwork-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of triangles',
  },
  's---grid-triangles---unfilled-uniform-color': {
    knob1: 'X offset',
    knob2: 'Y offset',
    knob3: 'Size of triangles',
  },
  's---h-circles---image': {
    knob1: 'Image size',
    knob2: 'Y offset',
    knob3: 'Circle size',
  },
  's---left--right-scopes': {
    knob1: 'Left scope X position',
    knob2: 'Right scope X position',
    knob3: 'Line width',
  },
  's---line-bounce-four---lfo-alternate': {
    knob1: 'Vertical line width',
    knob2: 'Horizontal line width',
    knob3: 'Speed',
  },
  's---line-bounce-two---lfo-alternate': {
    knob1: 'Vertical bounce amount',
    knob2: 'Line width',
    knob3: 'Speed',
  },
  's---line-traveller': {
    knob1: 'Size',
    knob2: 'Y speed',
    knob3: 'X speed',
  },
  's---mess-a-sketch': {
    knob1: 'X position',
    knob2: 'Y position',
    knob3: 'Line width',
  },
  's---mirror-grid': {
    knob1: 'Line width',
    knob2: 'Number of lines',
    knob3: 'Square size',
  },
  's---mirror-grid---inverse': {
    knob1: 'Line width',
    knob2: 'Number of lines',
    knob3: 'Square size',
  },
  's---nested-ellipses---filled': {
    knob1: 'Audio History',
    knob2: 'Vertical Position',
    knob3: 'Nested Ellipse Count',
  },
  's---nested-ellipses---outlines': {
    knob1: 'Audio History',
    knob2: 'Vertical Position',
    knob3: 'Ellipse Count',
  },
  's---perspective-lines': {
    knob1: 'X position',
    knob2: 'Y position',
    knob3: 'Line & circle size',
  },
  's---radial-scope---rotate-stepped-color': {
    knob1: 'Rotation rate and direction',
    knob2: 'Scope diameter',
    knob3: 'Line width & circle size',
  },
  's---radial-scope---rotate-uniform-color': {
    knob1: 'Rotation rate and direction',
    knob2: 'Scope diameter',
    knob3: 'Line width & circle size',
  },
  's---radiating-square---stepped-color': {
    knob1: 'X origin point LFO rate',
    knob2: 'Line width',
    knob3: 'Endpoint LFO rate',
  },
  's---radiating-square---uniform-color': {
    knob1: 'X origin point LFO rate',
    knob2: 'Line width',
    knob3: 'Endpoint LFO rate',
  },
  's---sound-jaws---stepped-color': {
    knob1: 'Number of teeth',
    knob2: 'Teeth shape',
    knob3: 'How close together teeth are',
  },
  's---sound-jaws---uniform-color': {
    knob1: 'Number of teeth',
    knob2: 'Teeth shape',
    knob3: 'How close together teeth are',
  },
  's---square-shadows---uniform-color': {
    knob1: 'Square Size',
    knob2: 'Shadow Control',
    knob3: 'Y Position',
  },
  's---x-scope': {
    knob1: 'Line width',
    knob2: 'Shadow angle & position',
    knob3: 'Scope angle & position',
  },
  's---zoom-scope': {
    knob1: 'Scope points',
    knob2: 'Scope X position',
    knob3: 'Scope Y position',
  },
  
  // Triggers
  't---font-patterns': {
    knob1: 'Horizontal offset',
    knob2: 'Size',
    knob3: 'Font set',
  },
  't---font-recedes': {
    knob1: 'Speed',
    knob2: 'Initial size',
    knob3: 'Shrink rate',
  },
  't---midi-grid': {
    knob1: 'MIDI Data',
    knob2: 'Grid Settings',
    knob3: 'Feedback setting',
  },
  't---midi-note-printer': {
    knob1: 'MIDI Note Stream',
    knob2: 'Angle',
    knob3: 'Square to Circle',
  },
  't---spiral-alley': {
    knob1: 'Spiral radius',
    knob2: 'Number of points',
    knob3: 'Spiral tightness',
  },
  't---tiles-filled': {
    knob1: 'Tile Size',
    knob2: 'Tile Count',
    knob3: 'Tile Pattern',
  },
  't---tiles---filled': {
    knob1: 'Number of displayed tiles',
    knob2: 'Size of feedback screen',
    knob3: 'Opacity of feedback screen',
  },
  't---tiles---outlines': {
    knob1: 'Number of displayed tiles',
    knob2: 'Size of feedback screen',
    knob3: 'Opacity of feedback screen',
  },
  't---10-print': {
    knob1: 'Line thickness',
    knob2: 'Rotation amount',
    knob3: 'Square size',
  },
  't---ball-of-mirrors': {
    knob1: 'X position',
    knob2: 'Y position',
    knob3: 'X scale',
  },
  't---ball-of-mirrors---trails': {
    knob1: 'Ball size',
    knob2: 'Trails distance',
    knob3: 'Trails opacity',
  },
  't---basic-image': {
    knob1: 'X position',
    knob2: 'Y position',
    knob3: 'Scale',
  },
  't---bezier-cousins---trails': {
    knob1: 'How complex shape is',
    knob2: 'Number of cousins',
    knob3: 'Space between cousins & alpha',
  },
  't---bits-h---row-color': {
    knob1: 'Number of lines',
    knob2: 'Line length',
    knob3: 'Shadow control',
  },
  't---bits-h---uniform-color': {
    knob1: 'Number of lines',
    knob2: 'Line length',
    knob3: 'Shadow control',
  },
  't---bits-v---column-color': {
    knob1: 'Number of lines',
    knob2: 'Line length',
    knob3: 'Shadow control',
  },
  't---bits-v---uniform-color': {
    knob1: 'Number of lines',
    knob2: 'Line length',
    knob3: 'Shadow control',
  },
  't---bom-reckies-trans-lfos': {
    knob1: 'Rect size change rate',
    knob2: 'Trails screen scale rate',
    knob3: 'Transparency',
  },
  't---density-units': {
    knob1: 'Rect diameter',
    knob2: 'Spacing',
    knob3: 'Filled/unfilled',
  },
  't---draws-hashmarks---angled-stepped-color': {
    knob1: 'Horizontal line count',
    knob2: 'Line thickness',
    knob3: 'Vertical line count',
  },
  't---draws-hashmarks---angled-uniform-color': {
    knob1: 'Horizontal line count',
    knob2: 'Line thickness',
    knob3: 'Vertical line count',
  },
  't---draws-hashmarks---stepped-color': {
    knob1: 'Horizontal line count',
    knob2: 'Line thickness',
    knob3: 'Vertical line count',
  },
  't---draws-hashmarks---uniform-color': {
    knob1: 'Horizontal line count',
    knob2: 'Line thickness',
    knob3: 'Vertical line count',
  },
  't---image--circle': {
    knob1: 'Image size/scale',
    knob2: 'Circle size',
    knob3: 'Image opacity',
  },
  't---isometric-wave': {
    knob1: 'Tile size/pattern range',
    knob2: 'Audio reactivity',
    knob3: 'Pattern density',
  },
  't---isometric-wave-runner': {
    knob1: 'Tile size/pattern range + animation speed',
    knob2: 'Audio reactivity',
    knob3: 'Pattern density',
  },
  't---line-rotate---trails': {
    knob1: 'Rotation speed',
    knob2: 'Line length & direction',
    knob3: 'Line width & trails opacity',
  },
  't---magnify-cloud---lfo': {
    knob1: 'Size/line width',
    knob2: 'Number of balls',
    knob3: 'LFO step speed',
  },
  't---marching-four---image': {
    knob1: 'X axis speed',
    knob2: 'Y axis speed',
    knob3: 'Image size',
  },
  't---migrating-circle-grids': {
    knob1: 'X axis speed & direction',
    knob2: 'Y axis speed & direction',
    knob3: 'Circle size',
  },
  't---origami-triangles': {
    knob1: 'X position',
    knob2: 'Y position',
    knob3: 'Density',
  },
  't---reckie': {
    knob1: 'Rect width',
    knob2: 'Rect height',
    knob3: 'Corner shape & outline thickness',
  },
  't---slideshow-grid-ag-alpha': {
    knob1: 'Scale X',
    knob2: 'Scale Y',
    knob3: 'Alpha/opacity',
  },
  't---trigon-traveller': {
    knob1: 'X travel direction',
    knob2: 'Y travel direction',
    knob3: 'Rotation amount when triggered',
  },
  't---woven-feedback': {
    knob1: 'Rectangle filled/outline thickness',
    knob2: 'Size of feedback screen',
    knob3: 'Opacity of feedback screen',
  },
  
  // Utilities
  'u---timer': {
    knob1: 'Hours',
    knob2: 'Minutes',
    knob3: 'Seconds',
  },
  'u---webcam': {
    knob1: 'Image size',
    knob2: 'Audio reactivity',
    knob3: 'Distortion effects',
  },
  
  // 3D modes
  '3d---rotating-cube': {
    knob1: 'Rotation Speed (X)',
    knob2: 'Rotation Speed (Y)',
    knob3: 'Cube Size',
  },
  '3d---particle-field': {
    knob1: 'Particle Speed',
    knob2: 'Particle Count',
    knob3: 'Particle Size',
  },
  '3d---geometric-shapes': {
    knob1: 'Rotation Speed',
    knob2: 'Number of Shapes',
    knob3: 'Shape Size',
  },
  '3d---rotating-sphere': {
    knob1: 'Rotation Speed (X)',
    knob2: 'Rotation Speed (Y)',
    knob3: 'Sphere Size',
  },
  '3d---torus-knot': {
    knob1: 'Rotation Speed',
    knob2: 'Knot Complexity',
    knob3: 'Knot Size',
  },
  '3d---wave-plane': {
    knob1: 'Wave Speed',
    knob2: 'Wave Amplitude',
    knob3: 'Wave Frequency',
  },
};

/**
 * Get knob descriptions for a mode
 */
export function getKnobDescriptions(modeId: string): ModeInfo['knobDescriptions'] {
  return knobDescriptions[modeId] || {
    knob1: 'Parameter 1',
    knob2: 'Parameter 2',
    knob3: 'Parameter 3',
  };
}

