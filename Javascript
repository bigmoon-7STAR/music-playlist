const CACHE_NAME = 'hello-pwa-v1';
const ASSETS = [
    'index.html',
    'manifest.json'
];

// インストール時にファイルをキャッシュする
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// ネットワークがない時はキャッシュから出す
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
