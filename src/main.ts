import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import './styles.css';
import { App } from './app/app.ts';
import { qaParams, runQa } from './app/qa.ts';

const root = document.getElementById('app')!;

const q = qaParams();
if (q) void runQa(root, q);
else new App(root).start();

// Offline: the service worker keeps every file on the tablet.
if (import.meta.env.PROD && 'serviceWorker' in navigator && !q) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* still works online */ });
  });
}

// No pinch-zoom or double-tap zoom surprises for small hands.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
