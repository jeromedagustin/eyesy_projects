import { TimelineStore } from './TimelineStore';
import { PreviewController } from './PreviewController';
import type { StitcherProject } from './types';
import {
  saveStitcherProject,
  listStitcherProjectSummaries,
  loadStitcherProject,
  deleteStitcherProject,
} from './projectStorage';

function baseHref(): string {
  const b = import.meta.env.BASE_URL;
  return b.endsWith('/') ? b.slice(0, -1) : b;
}

function homeUrl(): string {
  const b = baseHref();
  return b ? `${b}/` : '/';
}

function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00.0';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const whole = Math.floor(s);
  const tenths = Math.floor((s - whole) * 10);
  return `${m}:${whole.toString().padStart(2, '0')}.${tenths}`;
}

function probeDuration(objectUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.src = objectUrl;
    v.onloadedmetadata = () => {
      const d = v.duration;
      v.removeAttribute('src');
      v.load();
      resolve(Number.isFinite(d) && d > 0 ? d : 0);
    };
    v.onerror = () => {
      v.removeAttribute('src');
      reject(new Error('Failed to read video metadata'));
    };
  });
}

export function mountClipStitchApp(): void {
  const app = document.querySelector<HTMLElement>('#app');
  if (!app) {
    console.error('#app not found');
    return;
  }

  let projectId: string = crypto.randomUUID();
  let projectCreatedAt = new Date().toISOString();
  let preview: PreviewController | null = null;
  let scrubDragging = false;

  const store = new TimelineStore((kind) => {
    if (kind === 'full') renderSegments();
    else updateTrimLabels();
    syncTimeUi();
  });

  app.innerHTML = `
    <div class="cs-app">
      <header class="cs-header">
        <a class="cs-back" href="${homeUrl()}">← Home</a>
        <h1 class="cs-title">Clip Stitch</h1>
        <p class="cs-sub">Trim clips, order them on the timeline, preview as one sequence, save projects to this browser.</p>
      </header>

      <div class="cs-toolbar">
        <label class="cs-project-label">
          Project name
          <input type="text" id="cs-project-name" class="cs-input" value="Untitled project" maxlength="120" />
        </label>
        <input type="file" id="cs-file-input" accept="video/*" multiple class="cs-file-input" />
        <button type="button" class="cs-btn cs-btn-primary" id="cs-add-clips">Add video clips</button>
        <button type="button" class="cs-btn" id="cs-save-project">Save project</button>
        <label class="cs-load-label">
          Load project
          <select id="cs-load-select" class="cs-select">
            <option value="">—</option>
          </select>
        </label>
        <button type="button" class="cs-btn cs-btn-ghost" id="cs-new-project">New project</button>
        <button type="button" class="cs-btn cs-btn-danger" id="cs-delete-project">Delete saved</button>
      </div>

      <div class="cs-main">
        <section class="cs-panel cs-timeline-panel" aria-label="Timeline and clips">
          <h2 class="cs-h2">Clips &amp; order</h2>
          <div id="cs-segment-list" class="cs-segment-list"></div>
        </section>
        <section class="cs-panel cs-preview-panel" aria-label="Preview">
          <h2 class="cs-h2">Preview</h2>
          <div class="cs-video-wrap">
            <video id="cs-preview-video" class="cs-video" playsinline controls></video>
          </div>
          <div class="cs-transport">
            <button type="button" class="cs-btn cs-btn-primary" id="cs-play">Play</button>
            <button type="button" class="cs-btn" id="cs-pause">Pause</button>
            <span id="cs-time-display" class="cs-time">0:00.0 / 0:00.0</span>
          </div>
          <label class="cs-scrub-label">
            Timeline position
            <input type="range" id="cs-scrub" class="cs-scrub" min="0" max="1000" value="0" />
          </label>
          <aside class="cs-export-note" role="note">
            <strong>Export (next step)</strong>
            <p>Browsers cannot mux trimmed MP4s into one file with a single API. Plan: <em>ffmpeg.wasm</em>, <em>WebCodecs + muxer</em>, or <em>server-side FFmpeg</em> — see your stitcher spec §3.</p>
          </aside>
        </section>
      </div>
    </div>
    <style>
      .cs-app {
        min-height: 100vh;
        background: #121212;
        color: #e8e8e8;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 0 1.25rem 2rem;
      }
      .cs-header {
        padding: 1.25rem 0 0.5rem;
        border-bottom: 1px solid #2a2a2a;
        margin-bottom: 1rem;
      }
      .cs-back {
        color: #7eb8ff;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .cs-back:hover { text-decoration: underline; }
      .cs-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0.5rem 0 0.25rem;
        letter-spacing: 0.03em;
      }
      .cs-sub {
        margin: 0;
        color: #888;
        font-size: 0.9rem;
        max-width: 42rem;
        line-height: 1.45;
      }
      .cs-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: flex-end;
        margin-bottom: 1.25rem;
      }
      .cs-project-label, .cs-load-label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: #999;
      }
      .cs-input, .cs-select {
        background: #1e1e1e;
        border: 1px solid #3a3a3a;
        color: #fff;
        padding: 0.45rem 0.6rem;
        border-radius: 6px;
        min-width: 12rem;
      }
      .cs-file-input { display: none; }
      .cs-btn {
        background: #333;
        color: #fff;
        border: 1px solid #444;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
      }
      .cs-btn:hover { background: #3d3d3d; }
      .cs-btn-primary {
        background: #2a6bb8;
        border-color: #3d7fd4;
      }
      .cs-btn-primary:hover { background: #3d7fd4; }
      .cs-btn-ghost { background: transparent; }
      .cs-btn-danger { border-color: #843; color: #f8a8a8; }
      .cs-main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
        align-items: start;
      }
      @media (max-width: 900px) {
        .cs-main { grid-template-columns: 1fr; }
      }
      .cs-panel {
        background: #1a1a1a;
        border: 1px solid #2a2a2a;
        border-radius: 10px;
        padding: 1rem;
      }
      .cs-h2 {
        font-size: 1rem;
        margin: 0 0 0.75rem;
        color: #ccc;
      }
      .cs-segment-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-height: min(60vh, 520px);
        overflow-y: auto;
      }
      .cs-empty {
        color: #666;
        font-size: 0.9rem;
        margin: 0.5rem 0;
      }
      .cs-seg-card {
        background: #222;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 0.75rem;
      }
      .cs-seg-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .cs-seg-label {
        font-weight: 500;
        font-size: 0.85rem;
        word-break: break-all;
      }
      .cs-seg-meta {
        font-size: 0.75rem;
        color: #777;
      }
      .cs-seg-actions {
        display: flex;
        gap: 0.35rem;
        flex-shrink: 0;
      }
      .cs-seg-actions button {
        background: #2a2a2a;
        border: 1px solid #444;
        color: #ccc;
        padding: 0.2rem 0.45rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
      }
      .cs-trim-row {
        margin-top: 0.5rem;
      }
      .cs-trim-row label {
        display: block;
        font-size: 0.7rem;
        color: #888;
        margin-bottom: 0.2rem;
      }
      .cs-trim-row input[type="range"] {
        width: 100%;
      }
      .cs-video-wrap {
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        aspect-ratio: 16 / 10;
        max-height: 48vh;
      }
      .cs-video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        vertical-align: middle;
      }
      .cs-transport {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.75rem;
        flex-wrap: wrap;
      }
      .cs-time {
        font-variant-numeric: tabular-nums;
        color: #aaa;
        font-size: 0.9rem;
      }
      .cs-scrub-label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin-top: 0.75rem;
        font-size: 0.75rem;
        color: #888;
      }
      .cs-scrub { width: 100%; }
      .cs-export-note {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #252520;
        border: 1px solid #444033;
        border-radius: 8px;
        font-size: 0.8rem;
        color: #b9b59f;
        line-height: 1.45;
      }
      .cs-export-note p { margin: 0.35rem 0 0; }
    </style>
  `;

  const video = app.querySelector<HTMLVideoElement>('#cs-preview-video')!;
  const fileInput = app.querySelector<HTMLInputElement>('#cs-file-input')!;
  const segmentList = app.querySelector<HTMLElement>('#cs-segment-list')!;
  const scrub = app.querySelector<HTMLInputElement>('#cs-scrub')!;
  const timeDisplay = app.querySelector<HTMLElement>('#cs-time-display')!;
  const loadSelect = app.querySelector<HTMLSelectElement>('#cs-load-select')!;
  const projectNameInput = app.querySelector<HTMLInputElement>('#cs-project-name')!;

  preview = new PreviewController(video, store, () => {
    if (!scrubDragging) syncTimeUi();
  });

  function syncTimeUi(): void {
    const v = preview?.getVirtualTime() ?? 0;
    const total = store.totalVirtualDuration();
    timeDisplay.textContent = `${fmtTime(v)} / ${fmtTime(total)}`;
    if (!scrubDragging && total > 0) {
      scrub.value = String(Math.round((v / total) * 1000));
    }
  }

  function renderSegments(): void {
    const segs = store.getSortedSegments();
    if (segs.length === 0) {
      segmentList.innerHTML = '<p class="cs-empty">Add video files to start a timeline.</p>';
      syncTimeUi();
      return;
    }
    segmentList.innerHTML = segs
      .map((s) => {
        const d = s.mediaDuration;
        const ready = d > 0;
        const startVal = ready ? Math.round((s.trimStart / d) * 1000) : 0;
        const endVal = ready ? Math.round((s.trimEnd / d) * 1000) : 1000;
        return `
        <article class="cs-seg-card" data-segment-id="${s.id}">
          <div class="cs-seg-head">
            <div>
              <div class="cs-seg-label">${escapeHtml(s.label)}</div>
              <div class="cs-seg-meta">${
                ready
                  ? `Duration ${fmtTime(d)} · clip ${fmtTime(s.trimEnd - s.trimStart)}`
                  : 'Loading metadata…'
              }</div>
            </div>
            <div class="cs-seg-actions">
              <button type="button" data-action="up" title="Move earlier">↑</button>
              <button type="button" data-action="down" title="Move later">↓</button>
              <button type="button" data-action="remove" title="Remove">✕</button>
            </div>
          </div>
          <div class="cs-trim-row">
            <label>In point (${fmtTime(s.trimStart)})</label>
            <input type="range" class="cs-trim-start" data-segment-id="${s.id}" min="0" max="1000" value="${startVal}" ${ready ? '' : 'disabled'} />
          </div>
          <div class="cs-trim-row">
            <label>Out point (${fmtTime(s.trimEnd)})</label>
            <input type="range" class="cs-trim-end" data-segment-id="${s.id}" min="0" max="1000" value="${endVal}" ${ready ? '' : 'disabled'} />
          </div>
        </article>`;
      })
      .join('');
    syncTimeUi();
  }

  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function updateTrimLabels(): void {
    for (const s of store.getSortedSegments()) {
      const card = segmentList.querySelector(`[data-segment-id="${s.id}"]`);
      if (!card) continue;
      const labels = card.querySelectorAll<HTMLLabelElement>('.cs-trim-row label');
      if (labels[0]) labels[0].textContent = `In point (${fmtTime(s.trimStart)})`;
      if (labels[1]) labels[1].textContent = `Out point (${fmtTime(s.trimEnd)})`;
      const meta = card.querySelector('.cs-seg-meta');
      if (meta && s.mediaDuration > 0) {
        const d = s.mediaDuration;
        meta.textContent = `Duration ${fmtTime(d)} · clip ${fmtTime(s.trimEnd - s.trimStart)}`;
      }
    }
  }

  async function refreshLoadSelect(): Promise<void> {
    const list = await listStitcherProjectSummaries();
    const current = loadSelect.value;
    loadSelect.innerHTML =
      '<option value="">—</option>' +
      list
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
        .join('');
    if (list.some((p) => p.id === current)) loadSelect.value = current;
  }

  app.querySelector('#cs-add-clips')!.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const files = fileInput.files;
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('video/')) {
        window.alert(`Skipped (not a video): ${f.name}`);
        continue;
      }
      const id = store.addSegmentFromFile(f);
      const seg = store.getSegment(id);
      if (!seg) continue;
      try {
        const duration = await probeDuration(seg.objectUrl);
        if (duration <= 0) throw new Error('zero duration');
        store.setMediaDuration(id, duration);
      } catch {
        store.removeSegment(id);
        window.alert(`Could not read this video: ${f.name}`);
      }
    }
    fileInput.value = '';
  });

  segmentList.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button[data-action]');
    if (!btn) return;
    const card = btn.closest('[data-segment-id]');
    const id = card?.getAttribute('data-segment-id');
    if (!id) return;
    const action = btn.getAttribute('data-action');
    if (action === 'up') store.moveSegment(id, -1);
    else if (action === 'down') store.moveSegment(id, 1);
    else if (action === 'remove') {
      preview?.pause();
      store.removeSegment(id);
      preview?.seekVirtual(0);
    }
  });

  segmentList.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.type !== 'range') return;
    const id = el.dataset.segmentId;
    if (!id) return;
    const seg = store.getSegment(id);
    if (!seg || seg.mediaDuration <= 0) return;
    const d = seg.mediaDuration;
    const startSlider = el.classList.contains('cs-trim-start');
    const endSlider = el.classList.contains('cs-trim-end');
    const card = el.closest('.cs-seg-card');
    const startEl = card?.querySelector<HTMLInputElement>('.cs-trim-start');
    const endEl = card?.querySelector<HTMLInputElement>('.cs-trim-end');
    if (!startEl || !endEl) return;
    let trimStart = (Number(startEl.value) / 1000) * d;
    let trimEnd = (Number(endEl.value) / 1000) * d;
    if (startSlider) {
      if (trimStart >= trimEnd - 0.05) trimStart = Math.max(0, trimEnd - 0.05);
    }
    if (endSlider) {
      if (trimEnd <= trimStart + 0.05) trimEnd = Math.min(d, trimStart + 0.05);
    }
    store.setTrim(id, trimStart, trimEnd);
    if (preview) preview.seekVirtual(preview.getVirtualTime());
  });

  app.querySelector('#cs-play')!.addEventListener('click', () => {
    void preview?.play();
  });
  app.querySelector('#cs-pause')!.addEventListener('click', () => {
    preview?.pause();
  });

  scrub.addEventListener('pointerdown', () => {
    scrubDragging = true;
  });
  scrub.addEventListener('pointerup', () => {
    scrubDragging = false;
    syncTimeUi();
  });
  scrub.addEventListener('input', () => {
    const total = store.totalVirtualDuration();
    const t = (Number(scrub.value) / 1000) * total;
    preview?.pause();
    preview?.seekVirtual(t);
    syncTimeUi();
  });

  app.querySelector('#cs-save-project')!.addEventListener('click', () => {
    const name = projectNameInput.value.trim() || 'Untitled project';
    projectNameInput.value = name;
    const now = new Date().toISOString();
    const project: StitcherProject = {
      id: projectId,
      name,
      segments: store.snapshotSegmentsForSave(),
      createdAt: projectCreatedAt,
      updatedAt: now,
    };
    void saveStitcherProject(project).then(() => {
      void refreshLoadSelect();
      window.alert('Project saved in this browser (IndexedDB).');
    });
  });

  app.querySelector('#cs-new-project')!.addEventListener('click', () => {
    if (store.getSortedSegments().length > 0) {
      if (!window.confirm('Start a new project? Unsaved changes stay only in memory until you save.')) {
        return;
      }
    }
    preview?.pause();
    store.clear();
    projectId = crypto.randomUUID();
    projectCreatedAt = new Date().toISOString();
    projectNameInput.value = 'Untitled project';
    loadSelect.value = '';
    preview?.seekVirtual(0);
    renderSegments();
  });

  loadSelect.addEventListener('change', async () => {
    const id = loadSelect.value;
    if (!id) return;
    const p = await loadStitcherProject(id);
    if (!p) {
      window.alert('Project not found.');
      void refreshLoadSelect();
      return;
    }
    preview?.pause();
    store.replaceFromProject(p.segments);
    projectId = p.id;
    projectCreatedAt = p.createdAt;
    projectNameInput.value = p.name;
    for (const s of store.getSortedSegments()) {
      try {
        const duration = await probeDuration(s.objectUrl);
        store.setMediaDuration(s.id, duration);
      } catch {
        window.alert(`Could not load media for segment: ${s.label}`);
      }
    }
    preview?.seekVirtual(0);
  });

  app.querySelector('#cs-delete-project')!.addEventListener('click', async () => {
    const id = loadSelect.value;
    if (!id) {
      window.alert('Choose a saved project in Load project first.');
      return;
    }
    if (!window.confirm('Delete this saved project from the browser?')) return;
    await deleteStitcherProject(id);
    if (projectId === id) {
      preview?.pause();
      store.clear();
      projectId = crypto.randomUUID();
      projectCreatedAt = new Date().toISOString();
      projectNameInput.value = 'Untitled project';
      preview?.seekVirtual(0);
      renderSegments();
    }
    loadSelect.value = '';
    void refreshLoadSelect();
  });

  renderSegments();
  void refreshLoadSelect();
}
