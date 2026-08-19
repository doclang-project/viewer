/* DocLang Archive Viewer — boot */

import './components/viewer/viewer';
import type { DoclangViewer } from './components/viewer/viewer';

const viewer = document.querySelector('doclang-viewer') as DoclangViewer | null;

if (viewer) {
  // Auto-load demo if DEMO_ARCHIVE_URL is defined (injected by demo-data.js).
  // Read via globalThis to avoid Vite constant-folding a declare const away.
  if ((globalThis as Record<string, unknown>)['DEMO_ARCHIVE_URL']) {
    // Honour the pre-JS demo-loading class only when a demo will actually load.
    if (viewer.classList.contains('demo-loading')) {
      viewer.setInitialDemoLoading();
    }
    viewer.loadDemoOnBoot();
  }
}
