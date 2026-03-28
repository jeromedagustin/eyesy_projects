/**
 * Entry landing screen — opens the full visualizer at {base}/visualizer.
 */
function hrefFor(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '') || '';
  return base ? `${base}${path}` : path;
}

export function mountLandingPage(): void {
  const app = document.querySelector<HTMLElement>('#app');
  if (!app) {
    console.error('#app not found');
    return;
  }

  const visualizerHref = hrefFor('/visualizer');
  const clipStitchHref = hrefFor('/clip-stitch');

  app.innerHTML = `
    <main class="landing-root" aria-label="EYESY Web home">
      <div class="landing-inner">
        <h1 class="landing-title">EYESY Web</h1>
        <p class="landing-tagline">Audio-reactive visual modes</p>
        <div class="landing-actions">
          <a href="${visualizerHref}" class="landing-btn landing-btn-primary">Visualizer</a>
          <a href="${clipStitchHref}" class="landing-btn landing-btn-secondary">Clip Stitch</a>
        </div>
      </div>
    </main>
    <style>
      .landing-root {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: radial-gradient(ellipse 80% 60% at 50% 40%, #252525 0%, #121212 55%, #0a0a0a 100%);
      }
      .landing-inner {
        text-align: center;
        max-width: 28rem;
      }
      .landing-title {
        font-size: clamp(1.75rem, 5vw, 2.25rem);
        font-weight: 600;
        letter-spacing: 0.04em;
        color: #f2f2f2;
        margin-bottom: 0.5rem;
      }
      .landing-tagline {
        font-size: 1rem;
        color: #888;
        margin-bottom: 2rem;
      }
      .landing-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
      }
      .landing-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 12rem;
        padding: 0.85rem 1.75rem;
        font-size: 1.05rem;
        font-weight: 600;
        text-decoration: none;
        border: none;
        border-radius: 10px;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .landing-btn-primary {
        color: #fff;
        background: linear-gradient(165deg, #5aa8ff 0%, #3d7fd4 45%, #2a6bb8 100%);
        box-shadow: 0 4px 20px rgba(74, 158, 255, 0.35);
      }
      .landing-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 28px rgba(74, 158, 255, 0.45);
      }
      .landing-btn-secondary {
        color: #e8e8e8;
        background: linear-gradient(165deg, #3d3d42 0%, #2a2a30 50%, #1e1e24 100%);
        border: 1px solid #4a4a55;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      }
      .landing-btn-secondary:hover {
        transform: translateY(-2px);
        border-color: #6a6a78;
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45);
      }
      .landing-btn:focus-visible {
        outline: 2px solid #4a9eff;
        outline-offset: 3px;
      }
    </style>
  `;
}
