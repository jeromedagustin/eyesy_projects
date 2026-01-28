/**
 * Drawing primitives helper for Canvas
 * Handles all basic drawing operations (circles, lines, polygons, etc.)
 */
import * as THREE from 'three';
import { ObjectPool } from './pooling';

export interface DrawingContext {
  width: number;
  height: number;
  foregroundGroup: THREE.Group;
  objects: THREE.Object3D[];
  pool: ObjectPool;
}

/**
 * Convert screen coordinates to Three.js coordinates
 */
function toThreeCoords(x: number, y: number, width: number, height: number): [number, number] {
  return [x - width / 2, -(y - height / 2)];
}

/**
 * Fill entire canvas with color
 */
export function fill(
  context: DrawingContext,
  scene: THREE.Scene,
  backgroundObject: THREE.Object3D | null,
  setBackgroundObject: (obj: THREE.Object3D | null) => void,
  clearObjects: () => void,
  color: [number, number, number]
): void {
  // Remove old background if it exists
  if (backgroundObject) {
    scene.remove(backgroundObject);
    if (backgroundObject instanceof THREE.Mesh) {
      backgroundObject.geometry.dispose();
      if (backgroundObject.material instanceof THREE.Material) {
        backgroundObject.material.dispose();
      }
    }
  }
  
  // Clear foreground objects (but keep background separate)
  clearObjects();
  
  // Create a full-screen plane for background (fixed, no rotation/zoom)
  const geometry = new THREE.PlaneGeometry(context.width, context.height);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(0, 0, -1); // Behind foreground objects
  // Background is added directly to scene, not to foregroundGroup
  scene.add(plane);
  setBackgroundObject(plane);
}

/**
 * Draw a circle
 */
export function circle(
  context: DrawingContext,
  center: [number, number],
  radius: number,
  color: [number, number, number],
  width = 0
): void {
  const [x, y] = toThreeCoords(center[0], center[1], context.width, context.height);

  if (width > 0) {
    // Draw as outline (ring)
    const innerRadius = Math.max(1, radius - width);
    
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    context.foregroundGroup.add(mesh);
    context.objects.push(mesh);
  } else {
    // Draw as filled circle
    const segments = Math.max(8, Math.min(64, Math.floor(radius / 2)));
    const geometry = context.pool.getCircleGeometry(radius, segments);
    const material = context.pool.getMeshMaterial(color);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    context.foregroundGroup.add(mesh);
    context.objects.push(mesh);
  }
}

/**
 * Draw a line
 */
export function line(
  context: DrawingContext,
  start: [number, number],
  end: [number, number],
  color: [number, number, number],
  width = 1
): void {
  const [x1, y1] = toThreeCoords(start[0], start[1], context.width, context.height);
  const [x2, y2] = toThreeCoords(end[0], end[1], context.width, context.height);

  const points = [
    new THREE.Vector3(x1, y1, 0),
    new THREE.Vector3(x2, y2, 0),
  ];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = context.pool.getLineMaterial(color, width);
  const line = new THREE.Line(geometry, material);
  context.foregroundGroup.add(line);
  context.objects.push(line);
}

/**
 * Draw multiple connected lines (polyline)
 */
export function lines(
  context: DrawingContext,
  points: [number, number][],
  color: [number, number, number],
  width = 1,
  closed = false
): void {
  if (points.length < 2) return;

  const threePoints = points.map(([x, y]) => {
    const [tx, ty] = toThreeCoords(x, y, context.width, context.height);
    return new THREE.Vector3(tx, ty, 0);
  });

  if (closed && points.length > 2) {
    threePoints.push(threePoints[0]); // Close the loop
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(threePoints);
  const material = context.pool.getLineMaterial(color, width);
  const line = new THREE.Line(geometry, material);
  context.foregroundGroup.add(line);
  context.objects.push(line);
}

/**
 * Draw a rectangle
 */
export function rect(
  context: DrawingContext,
  x: number,
  y: number,
  w: number,
  h: number,
  color: [number, number, number],
  width = 0
): void {
  if (width > 0) {
    // Draw as outline using lines
    const halfWidth = width / 2;
    line(context, [x + halfWidth, y], [x + w - halfWidth, y], color, width);
    line(context, [x + w, y + halfWidth], [x + w, y + h - halfWidth], color, width);
    line(context, [x + w - halfWidth, y + h], [x + halfWidth, y + h], color, width);
    line(context, [x, y + h - halfWidth], [x, y + halfWidth], color, width);
  } else {
    // Draw as filled rectangle
    const rectPoints: [number, number][] = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];
    polygon(context, rectPoints, color, 0);
  }
}

/**
 * Draw an ellipse
 */
export function ellipse(
  context: DrawingContext,
  center: [number, number],
  radiusX: number,
  radiusY: number,
  color: [number, number, number],
  width = 0
): void {
  const [x, y] = toThreeCoords(center[0], center[1], context.width, context.height);

  if (width > 0) {
    // Draw as outline (ring)
    const shape = new THREE.Shape();
    shape.ellipse(0, 0, radiusX, radiusY, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.ellipse(0, 0, radiusX - width, radiusY - width, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    context.foregroundGroup.add(mesh);
    context.objects.push(mesh);
  } else {
    // Draw as filled ellipse
    const shape = new THREE.Shape();
    shape.ellipse(0, 0, radiusX, radiusY, 0, Math.PI * 2, false);
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    context.foregroundGroup.add(mesh);
    context.objects.push(mesh);
  }
}

/**
 * Draw an arc (portion of a circle/ellipse)
 */
export function arc(
  context: DrawingContext,
  center: [number, number],
  radiusX: number,
  radiusY: number,
  startAngle: number,
  endAngle: number,
  color: [number, number, number],
  width = 1
): void {
  const [x, y] = toThreeCoords(center[0], center[1], context.width, context.height);

  const shape = new THREE.Shape();
  shape.ellipse(0, 0, radiusX, radiusY, startAngle, endAngle, false);
  
  if (width > 0) {
    // Draw as outline - create a ring
    const innerRadiusX = Math.max(0, radiusX - width);
    const innerRadiusY = Math.max(0, radiusY - width);
    const hole = new THREE.Path();
    hole.ellipse(0, 0, innerRadiusX, innerRadiusY, startAngle, endAngle, true);
    shape.holes.push(hole);
  }
  
  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);
  context.foregroundGroup.add(mesh);
  context.objects.push(mesh);
}

/**
 * Draw a polygon
 */
export function polygon(
  context: DrawingContext,
  points: [number, number][],
  color: [number, number, number],
  width = 0
): void {
  if (points.length === 0) return;

  if (width > 0) {
    // Draw as outline
    lines(context, points, color, width, true);
  } else {
    // Draw as filled polygon
    const shape = new THREE.Shape();
    
    const firstPoint = points[0];
    const [x0, y0] = toThreeCoords(firstPoint[0], firstPoint[1], context.width, context.height);
    shape.moveTo(x0, y0);
    
    for (let i = 1; i < points.length; i++) {
      const [x, y] = toThreeCoords(points[i][0], points[i][1], context.width, context.height);
      shape.lineTo(x, y);
    }
    shape.lineTo(x0, y0); // Close the shape
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = context.pool.getMeshMaterial(color);
    const mesh = new THREE.Mesh(geometry, material);
    context.foregroundGroup.add(mesh);
    context.objects.push(mesh);
  }
}

/**
 * Draw a bezier curve (quadratic or cubic)
 */
export function bezier(
  context: DrawingContext,
  points: [number, number][],
  color: [number, number, number],
  width: number = 1,
  segments: number = 20
): void {
  if (points.length < 3) return; // Need at least 3 points for quadratic bezier

  const threePoints = points.map(([x, y]) => {
    const [tx, ty] = toThreeCoords(x, y, context.width, context.height);
    return new THREE.Vector3(tx, ty, 0);
  });

  let curve: THREE.Curve<THREE.Vector3>;
  if (points.length === 3) {
    // Quadratic bezier (3 control points)
    curve = new THREE.QuadraticBezierCurve3(
      threePoints[0],
      threePoints[1],
      threePoints[2]
    );
  } else if (points.length === 4) {
    // Cubic bezier (4 control points)
    curve = new THREE.CubicBezierCurve3(
      threePoints[0],
      threePoints[1],
      threePoints[2],
      threePoints[3]
    );
  } else {
    // For more points, use quadratic segments
    const curvePoints: THREE.Vector3[] = [];
    for (let i = 0; i < points.length - 2; i += 2) {
      if (i + 2 < points.length) {
        const seg = new THREE.QuadraticBezierCurve3(
          threePoints[i],
          threePoints[i + 1],
          threePoints[i + 2]
        );
        const segPoints = seg.getPoints(segments / (points.length - 2));
        curvePoints.push(...segPoints);
      }
    }
    // Create a curve from the points
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = context.pool.getLineMaterial(color, width);
    const line = new THREE.Line(curveGeometry, curveMaterial);
    context.foregroundGroup.add(line);
    context.objects.push(line);
    return;
  }

  // Sample points from the curve
  const curvePoints = curve.getPoints(segments);
  const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
  const material = context.pool.getLineMaterial(color, width);
  const line = new THREE.Line(geometry, material);
  context.foregroundGroup.add(line);
  context.objects.push(line);
}
