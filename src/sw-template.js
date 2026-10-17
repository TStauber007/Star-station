// Star Station service worker. Keeps every app file on this device.
// It never talks to any other server.
const VERSION = '__VERSION__';
const CACHE = `star-station-${VERSION}`;
const FILES = __FILES__;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // add in small batches, retrying once, so one hiccup doesn't lose everything
    for (let i = 0; i < FILES.length; i += 40) {
      const batch = FILES.slice(i, i + 40);
      try { await cache.addAll(batch); }
      catch { await cache.addAll(batch); }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(event.request, { ignoreSearch: true });
    if (hit) return hit;
    if (event.request.mode === 'navigate') {
      const index = await cache.match('./index.html') || await cache.match('./');
      if (index) return index;
    }
    try { return await fetch(event.request); }
    catch { return new Response('', { status: 504 }); }
  })());
});
