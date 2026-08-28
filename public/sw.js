const CACHE = 'loop-notebook-shell-v3';
const ASSETS = ['/', '/index.html', '/demo/', '/demo/index.html', '/privacy/', '/privacy/index.html', '/terms/', '/terms/index.html', '/unlock/', '/unlock/index.html', '/404.html', '/offline.html', '/offline.css', '/manifest.webmanifest', '/assets/loop-desk.20260828.webp', '/assets/loop-desk-576.20260828.webp', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    const shell = await fetch('/index.html');
    const html = await shell.clone().text();
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
    if (builtAssets.length) await cache.addAll(builtAssets);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    }).catch(async () => {
      const direct = await caches.match(request, { ignoreSearch: true });
      if (direct) return direct;
      const pathname = new URL(request.url).pathname;
      if (pathname === '/demo' || pathname === '/demo/') return (await caches.match('/demo/index.html')) || (await caches.match('/index.html'));
      return (await caches.match('/index.html')) || (await caches.match('/offline.html'));
    }));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(url.pathname, { ignoreSearch: true });
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(url.pathname, response.clone());
    return response;
  })());
});
