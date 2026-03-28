# Clip Stitch — video export & stitching roadmap

This document captures **options, tradeoffs, and a phased plan** for turning trimmed, ordered clips in **Clip Stitch** into **one muxed output file** (e.g. MP4). Update it as we try spikes and lock decisions.

**Related code:** `src/clip-stitch/` (`ClipStitchApp.ts`, `TimelineStore.ts`, `PreviewController.ts`, `projectStorage.ts`).  
**UI note:** The in-app “Export (next step)” panel summarizes the same constraint for users.

---

## 1. Goal

- **Input:** Multiple user videos on a single timeline, each with **in/out trim** and **order**.
- **Output:** **One** playable file (typical target: **MP4** with broadly compatible video + audio).
- **Preview today:** Sequential playback with one `<video>` element and boundary seeks — **no** single Web API to “concat these MP4 byte ranges” into one file without a decode/mux pipeline.

---

## 2. Why the browser cannot “just stitch” MP4s

There is **no** standard, high-level API that means: *take N trimmed MP4s and write one muxed MP4*. Realistic pipelines must:

1. **Demux** inputs (split video/audio packets).
2. **Trim** on a timeline (discard outside in/out; align timestamps).
3. **Concatenate** segments in order.
4. **Mux** into a container (and often **re-encode** if codecs/timescales don’t match).

So export is an engineering choice among **where** that work runs (client vs server) and **which** stack implements it (FFmpeg, WebCodecs, etc.).

---

## 3. Approaches (summary)

| Approach | Where it runs | Strengths | Risks / cost |
|----------|----------------|------------|----------------|
| **FFmpeg (WebAssembly)** | Browser (worker) | No backend; familiar FFmpeg semantics; good for prototypes and small/medium jobs | Large download; RAM/CPU; slow on low-end devices; **mobile Safari** can be limiting |
| **FFmpeg (or similar) on a server** | Backend | Handles **large** files and long timelines; consistent quality; easier to cap cost with queues | Privacy, upload bandwidth, storage, auth, ops |
| **WebCodecs + muxer** (e.g. **mp4box.js** or custom) | Browser | Maximum control; can optimize specific codecs/paths | High implementation + QA cost; codec and timestamp edge cases |
| **Canvas + `captureStream` + `MediaRecorder`** | Browser | No FFmpeg bundle | Sync, quality, and generality are **fragile**; poor default for “any user MP4” |

**Audio-only pipelines** (e.g. `OfflineAudioContext` → WAV) are **not** sufficient for the v1 **video container** deliverable; they may still help optional **waveform preview** later.

---

## 4. Decision lens (what to optimize for)

Use this table when choosing or combining approaches:

| Priority | Favor |
|----------|--------|
| Ship export **without** operating a server | **ffmpeg.wasm** (with strict limits + great UX) |
| **Mobile Safari** / long exports / heavy files | **Server-side** encode/mux |
| Long-term custom pipeline, avoid shipping full FFmpeg | **WebCodecs + muxer** (budget for engineering) |
| Quick internal demo only | **MediaRecorder** path (document limitations; don’t treat as main product path) |

**Hybrid strategy (common):** Client-side export for **short** projects under clear limits; **server** job for anything over threshold or when wasm fails.

---

## 5. Product & UX requirements (any technical path)

These apply regardless of wasm vs server:

- **Output contract:** State target format (e.g. MP4 **H.264 + AAC**) and where it is supported.
- **Limits:** Max file size, total duration, segment count, resolution — enforced **before** starting work.
- **Progress:** Determinate or indeterminate progress, cancel, and cleanup (revoke object URLs, abort worker/fetch).
- **Errors:** Clear messages for unsupported codec, out-of-memory, quota, network failure, or worker crash.
- **Privacy:** If server: data retention, encryption in transit, regional compliance — documented for users.

---

## 6. Suggested implementation phases

### Phase A — Spike: single-segment export

- Prove **decode → mux → download** for **one** trimmed blob (smallest slice of the full problem).

### Phase B — Multi-segment concat

- **Ordered** segments with trims; output one file.
- Prefer **re-encode to a known profile** first for **predictable** compatibility; optimize to **re-mux-only** later if inputs are homogeneous.

### Phase C — Productize

- Limits, cancellation, persistence (how export relates to saved **IndexedDB** projects in `projectStorage.ts`).
- Telemetry/logging (anonymous) for failure modes if acceptable.

### Phase D — Polish (optional)

- Filmstrip thumbnails, transitions, crossfades, multi-track audio — **not** required for first muxed export.

---

## 7. Decisions to lock before major build

Track answers here as we decide:

1. **Primary export venue:** browser (wasm) vs **server** vs hybrid.
2. **Output format:** e.g. MP4 (H.264 + AAC) vs WebM-first.
3. **Re-mux vs re-encode default:** compatibility vs speed.
4. **Caps:** max resolution, total duration, segment count, upload size (if server).

| Decision | Choice | Date / notes |
|----------|--------|--------------|
| Primary venue | TBD | |
| Output format | TBD | |
| Default strategy | TBD | |
| Limits | TBD | |

---

## 8. Technical notes for implementation

### ffmpeg.wasm (typical stack)

- Packages often used: **`@ffmpeg/ffmpeg`**, **`@ffmpeg/util`**, plus a **core** wasm asset (self-hosted or CDN).
- Run FFmpeg in a **Web Worker** so the UI thread stays responsive.
- Copy inputs into FFmpeg’s virtual FS (`writeFile`), run **`ffmpeg` CLI** with a concat or filter graph, `readFile` the output blob, then trigger download.

### Server FFmpeg

- Accept uploads or **presigned object storage** URLs; enqueue job; return download URL or stream.
- Same FFmpeg arguments conceptually as desktop; easier to scale with workers/queues.

### WebCodecs + muxer

- Own **timestamp** math across segment boundaries; test **Safari** and **Chrome** separately.
- Audio sync and variable frame rate inputs are common pain points.

---

## 9. References

- In-app stitcher spec (portable): multi-clip timeline, trim, preview, muxed export expectations (shared planning doc).
- MDN: **WebCodecs**, **MediaRecorder**, **HTMLVideoElement** (preview patterns).

---

## 10. Document history

| Version | Notes |
|---------|--------|
| 1.0 | Initial capture: approaches, tradeoffs, phases, decisions table; aligns with Clip Stitch UI messaging. |

When you change strategy or ship a milestone, add a row above and bump the version note.
