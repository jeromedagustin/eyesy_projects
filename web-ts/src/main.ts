import { App } from './App';
import { mountLandingPage } from './LandingPage';
import { mountClipStitchApp } from './clip-stitch';

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function pathFromBase(suffix: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '') || '';
  return base ? `${base}${suffix}` : suffix;
}

const path = normalizePath(window.location.pathname);
const visualizerPath = pathFromBase('/visualizer');
const clipStitchPath = pathFromBase('/clip-stitch');

if (path === visualizerPath) {
  new App();
} else if (path === clipStitchPath) {
  mountClipStitchApp();
} else {
  mountLandingPage();
}
