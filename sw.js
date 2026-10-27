const CACHE_NAME = 'aux-vendas-instantaneo-v1';
const assets = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    }).then(() => self.skipWaiting()) // Força o app a atualizar na hora
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

// ESTRATÉGIA DE VELOCIDADE: Pega do celular primeiro, se não tiver, busca na rede
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; 
      }
      return fetch(e.request);
    })
  );
});
