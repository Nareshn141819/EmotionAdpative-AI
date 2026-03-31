const CACHE = 'emotion-ai-v1';
const OFFLINE = ['/Emotion-AI/', '/Emotion-AI/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(r => r || caches.match('/Emotion-AI/'))
    )
  );
});
