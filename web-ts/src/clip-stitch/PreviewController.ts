import type { TimelineStore } from './TimelineStore';
import type { SegmentRuntime } from './types';

/**
 * Sequential preview: one <video> element, jump at trim boundaries (spec §4 pattern).
 */
export class PreviewController {
  private video: HTMLVideoElement;
  private store: TimelineStore;
  private virtualTime = 0;
  private playing = false;
  private activeSegmentId: string | null = null;
  private onTimeUpdate: (virtualTime: number, total: number) => void;
  private readonly boundTimeUpdate: () => void;
  private readonly boundEnded: () => void;

  constructor(
    video: HTMLVideoElement,
    store: TimelineStore,
    onTimeUpdate: (virtualTime: number, total: number) => void
  ) {
    this.video = video;
    this.store = store;
    this.onTimeUpdate = onTimeUpdate;
    this.boundTimeUpdate = () => this.onVideoTimeUpdate();
    this.boundEnded = () => this.onVideoEnded();
    this.video.addEventListener('timeupdate', this.boundTimeUpdate);
    this.video.addEventListener('ended', this.boundEnded);
  }

  dispose(): void {
    this.pause();
    this.video.removeEventListener('timeupdate', this.boundTimeUpdate);
    this.video.removeEventListener('ended', this.boundEnded);
  }

  getVirtualTime(): number {
    return this.virtualTime;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  pause(): void {
    this.playing = false;
    this.video.pause();
  }

  async play(): Promise<void> {
    const total = this.store.totalVirtualDuration();
    if (total <= 0) return;
    if (this.virtualTime >= total - 1e-3) {
      this.seekVirtual(0);
    }
    this.playing = true;
    await this.ensureLoadedAtVirtual(this.virtualTime);
    try {
      await this.video.play();
    } catch {
      this.playing = false;
    }
  }

  seekVirtual(t: number): void {
    const total = this.store.totalVirtualDuration();
    this.virtualTime = Math.max(0, Math.min(t, Math.max(0, total)));
    const mapped = this.store.virtualToLocal(this.virtualTime);
    if (!mapped) {
      this.video.removeAttribute('src');
      this.video.load();
      this.activeSegmentId = null;
      this.emit();
      return;
    }
    this.loadSegmentAt(mapped.segment, mapped.localTime);
    this.emit();
  }

  private emit(): void {
    this.onTimeUpdate(this.virtualTime, this.store.totalVirtualDuration());
  }

  private onVideoTimeUpdate(): void {
    if (!this.playing || !this.activeSegmentId) return;
    const seg = this.store.getSegment(this.activeSegmentId);
    if (!seg || seg.mediaDuration <= 0) return;
    if (this.video.currentTime >= seg.trimEnd - 0.04) {
      this.advanceAfterSegment(seg);
    } else {
      this.virtualTime = this.store.localToVirtual(seg.id, this.video.currentTime);
      this.emit();
    }
  }

  private onVideoEnded(): void {
    if (!this.playing || !this.activeSegmentId) return;
    const seg = this.store.getSegment(this.activeSegmentId);
    if (seg) this.advanceAfterSegment(seg);
  }

  private advanceAfterSegment(finished: SegmentRuntime): void {
    const sorted = this.store.getSortedSegments();
    const idx = sorted.findIndex((s) => s.id === finished.id);
    const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
    if (!next) {
      this.virtualTime = this.store.totalVirtualDuration();
      this.pause();
      this.emit();
      return;
    }
    this.loadSegmentAt(next, next.trimStart);
    this.virtualTime = this.store.localToVirtual(next.id, next.trimStart);
    this.emit();
    if (this.playing) {
      void this.waitCanPlay().then(() => {
        void this.video.play().catch(() => {
          this.playing = false;
        });
      });
    }
  }

  private waitCanPlay(): Promise<void> {
    return new Promise((resolve) => {
      if (this.video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        resolve();
        return;
      }
      this.video.addEventListener('canplay', () => resolve(), { once: true });
    });
  }

  private loadSegmentAt(seg: SegmentRuntime, localTime: number): void {
    const clamped = Math.max(seg.trimStart, Math.min(localTime, seg.trimEnd));
    if (this.activeSegmentId !== seg.id) {
      this.activeSegmentId = seg.id;
      this.video.src = seg.objectUrl;
      this.video.addEventListener(
        'loadedmetadata',
        () => {
          this.video.currentTime = clamped;
        },
        { once: true }
      );
      this.video.load();
      return;
    }
    if (Math.abs(this.video.currentTime - clamped) > 0.05) {
      this.video.currentTime = clamped;
    }
  }

  private async ensureLoadedAtVirtual(v: number): Promise<void> {
    const mapped = this.store.virtualToLocal(v);
    if (!mapped) return;
    this.loadSegmentAt(mapped.segment, mapped.localTime);
    await new Promise<void>((resolve, reject) => {
      const done = (): void => {
        this.video.removeEventListener('loadeddata', done);
        this.video.removeEventListener('error', err);
        resolve();
      };
      const err = (): void => {
        this.video.removeEventListener('loadeddata', done);
        this.video.removeEventListener('error', err);
        reject(new Error('video load error'));
      };
      if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        resolve();
        return;
      }
      this.video.addEventListener('loadeddata', done, { once: true });
      this.video.addEventListener('error', err, { once: true });
    }).catch(() => {});
  }
}
