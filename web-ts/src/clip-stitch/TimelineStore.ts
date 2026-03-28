import {
  type SegmentRuntime,
  type TimelineSegment,
  clampTrim,
  segmentPlaybackDuration,
} from './types';

/** `full` re-lists segments; `trim` only updates labels (keeps range inputs interactive). */
export type TimelineChangeKind = 'full' | 'trim';

export class TimelineStore {
  private segments = new Map<string, SegmentRuntime>();
  private onChange: (kind: TimelineChangeKind) => void;

  constructor(onChange: (kind: TimelineChangeKind) => void) {
    this.onChange = onChange;
  }

  private emit(kind: TimelineChangeKind): void {
    this.onChange(kind);
  }

  getSortedSegments(): SegmentRuntime[] {
    return Array.from(this.segments.values()).sort((a, b) => a.order - b.order);
  }

  getSegment(id: string): SegmentRuntime | undefined {
    return this.segments.get(id);
  }

  totalVirtualDuration(): number {
    return this.getSortedSegments().reduce(
      (sum, s) => sum + segmentPlaybackDuration(s),
      0
    );
  }

  /** Map virtual timeline position (seconds) to segment + local media time */
  virtualToLocal(virtualTime: number): { segment: SegmentRuntime; localTime: number } | null {
    const sorted = this.getSortedSegments();
    if (sorted.length === 0) return null;
    let t = Math.max(0, virtualTime);
    for (let i = 0; i < sorted.length; i++) {
      const seg = sorted[i];
      const len = segmentPlaybackDuration(seg);
      if (len <= 0) continue;
      const isLast = i === sorted.length - 1;
      if (t < len || (isLast && t <= len + 0.02)) {
        return { segment: seg, localTime: seg.trimStart + Math.min(t, len) };
      }
      t -= len;
    }
    const last = sorted[sorted.length - 1];
    return { segment: last, localTime: last.trimEnd };
  }

  /** Current segment's contribution to virtual time at given local media time */
  localToVirtual(segmentId: string, localTime: number): number {
    const sorted = this.getSortedSegments();
    let v = 0;
    for (const seg of sorted) {
      if (seg.id === segmentId) {
        const t = Math.max(seg.trimStart, Math.min(localTime, seg.trimEnd));
        return v + (t - seg.trimStart);
      }
      v += segmentPlaybackDuration(seg);
    }
    return v;
  }

  addSegmentFromFile(file: File): string {
    const id = crypto.randomUUID();
    const objectUrl = URL.createObjectURL(file);
    const order =
      this.segments.size === 0
        ? 0
        : Math.max(...Array.from(this.segments.values()).map((s) => s.order)) + 1;

    const seg: SegmentRuntime = {
      id,
      label: file.name,
      source: file,
      objectUrl,
      trimStart: 0,
      trimEnd: 0,
      order,
      mediaDuration: 0,
    };
    this.segments.set(id, seg);
    this.emit('full');
    return id;
  }

  removeSegment(id: string): void {
    const s = this.segments.get(id);
    if (!s) return;
    URL.revokeObjectURL(s.objectUrl);
    this.segments.delete(id);
    this.normalizeOrder();
    this.emit('full');
  }

  setMediaDuration(id: string, duration: number): void {
    const s = this.segments.get(id);
    if (!s) return;
    s.mediaDuration = duration;
    const { trimStart, trimEnd } = clampTrim(s.trimStart, s.trimEnd || duration, duration);
    s.trimStart = trimStart;
    s.trimEnd = trimEnd === 0 && duration > 0 ? duration : trimEnd;
    this.emit('full');
  }

  setTrim(id: string, trimStart: number, trimEnd: number): void {
    const s = this.segments.get(id);
    if (!s || s.mediaDuration <= 0) return;
    const c = clampTrim(trimStart, trimEnd, s.mediaDuration);
    s.trimStart = c.trimStart;
    s.trimEnd = c.trimEnd;
    this.emit('trim');
  }

  moveSegment(id: string, direction: -1 | 1): void {
    const sorted = this.getSortedSegments();
    const idx = sorted.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const j = idx + direction;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[j];
    const tmp = a.order;
    a.order = b.order;
    b.order = tmp;
    this.emit('full');
  }

  replaceFromProject(projectSegments: TimelineSegment[]): void {
    for (const s of this.segments.values()) {
      URL.revokeObjectURL(s.objectUrl);
    }
    this.segments.clear();
    for (const raw of projectSegments) {
      const blob = raw.source;
      const objectUrl = URL.createObjectURL(blob);
      const seg: SegmentRuntime = {
        ...raw,
        source: blob,
        objectUrl,
        mediaDuration: 0,
      };
      this.segments.set(seg.id, seg);
    }
    this.normalizeOrder();
    this.emit('full');
  }

  clear(): void {
    for (const s of this.segments.values()) {
      URL.revokeObjectURL(s.objectUrl);
    }
    this.segments.clear();
    this.emit('full');
  }

  snapshotSegmentsForSave(): TimelineSegment[] {
    return this.getSortedSegments().map((s) => ({
      id: s.id,
      label: s.label,
      source: s.source,
      trimStart: s.trimStart,
      trimEnd: s.trimEnd,
      order: s.order,
    }));
  }

  private normalizeOrder(): void {
    const sorted = this.getSortedSegments();
    sorted.forEach((s, i) => {
      s.order = i;
    });
  }
}
