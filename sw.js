'use strict';
const CACHE = 'michi-v4';
const ASSETS = ['./', './index.html', './app.js?v=1.2.0', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    // Avoid caching a sign-in page returned by the private hosting layer.
    for (const path of ASSETS) {
      const request = new Request(path, {cache: 'reload', credentials: 'same-origin'});
      const response = await fetch(request);
      if (!response.ok || response.redirected || new URL(response.url).origin !== self.location.origin) {
        throw new Error('Application assets are not available.');
      }
      await cache.put(request, response);
    }
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('michi-') && key !== CACHE).map(key => caches.delete(key))
  )));
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!ASSETS.some(path => new URL(path, self.registration.scope).pathname === url.pathname)) return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request, {ignoreSearch: true});
    if (cached) return cached;
    if (event.request.mode === 'navigate') return await cache.match('./index.html') || Response.error();
    return Response.error();
  }));
});
