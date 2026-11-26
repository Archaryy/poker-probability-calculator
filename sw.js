const CACHE = 'cardcraft-v8';
const FILES = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/main.js', 'js/cards.js', 'js/odds.js', 'js/evaluator.js',
  'js/ranges.js', 'js/simulate.js', 'js/dom.js', 'js/tour.js', 'js/tabs.js', 'js/advice.js',
  'js/worker.js',
  'assets/icons/icon-192.svg', 'assets/icons/icon-512.svg',
  'assets/icons/apple-touch-icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }))
  );
});