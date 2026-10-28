const CACHE_NAME = 'aux-vendas-instantaneo-v2'; // Mudamos a versão para forçar o celular a atualizar
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
      // Ignora erros ao tentar colocar na memória arquivos externos ou inexistentes
      return cache.addAll(assets).catch(err => console.log("Aviso no cache: ", err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // Remove caches antigos imediatamente para atualizar o celular do usuário
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ESTRATÉGIA REDE PRIMEIRO: Busca na internet primeiro. Se falhar (offline), usa o celular.
self.addEventListener('fetch', e => {
  // Não tenta armazenar links externos do Firebase no cache local do aparelho
  if (!e.request.url.includes(location.origin)) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
