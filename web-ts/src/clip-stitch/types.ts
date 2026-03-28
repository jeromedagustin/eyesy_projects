/**
 * Multi-clip stitcher data model (aligned with portable stitcher spec).
 */

export interface TimelineSegment {
  id: string;
  /** Display name or original filename */
  label: string;
  /** User file or persisted blob */
  source: File | Blob;
  /** Trims relative to source media start, seconds */
  trimStart: number;
  trimEnd: number;
  /** Sort order (0 = first) */
  order: number;
}

/** Runtime fields after probing the file */
export interface SegmentRuntime extends TimelineSegment {
  /** Object URL for <video> */
  objectUrl: string;
  /** Duration from loadedmetadata */
  mediaDuration: number;
}

export interface StitcherProject {
  id: string;
  name: string;
  segments: TimelineSegment[];
  createdAt: string;
  updatedAt: string;
}

export function clampTrim(
  trimStart: number,
  trimEnd: number,
  mediaDuration: number
): { trimStart: number; trimEnd: number } {
  const d = Math.max(0, mediaDuration);
  let a = Math.max(0, Math.min(trimStart, d));
  let b = Math.max(0, Math.min(trimEnd, d));
  if (b <= a) {
    b = Math.min(d, a + 0.05);
  }
  return { trimStart: a, trimEnd: b };
}

export function segmentPlaybackDuration(seg: Pick<TimelineSegment, 'trimStart' | 'trimEnd'>): number {
  return Math.max(0, seg.trimEnd - seg.trimStart);
}
