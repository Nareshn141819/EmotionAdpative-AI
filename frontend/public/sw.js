const CACHE = 'emotion-ai-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['/Emotion-AI/', '/Emotion-AI/index.html'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(r =>
        r || caches.match('/Emotion-AI/index.html')
      )
    )
  );
});
