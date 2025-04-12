// Service Worker for AR Blender Model Viewer
const CACHE_NAME = 'ar-blender-viewer-v1';
const urlsToCache = [
    './',
    './index.html',
    './css/styles.css',
    './js/main.js',
    './js/ar-components.js',
    './js/ui-manager.js',
    './models/model.glb',
    'https://aframe.io/releases/1.3.0/aframe.min.js',
    'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js',
    'https://raw.githack.com/donmccurdy/aframe-extras/master/dist/aframe-extras.loaders.min.js',
    'https://unpkg.com/aframe-event-set-component@5.0.0/dist/aframe-event-set-component.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Cache files
const filesToCache = [
  './',
  './index.html',
  './js/main.js',
  './js/ar-components.js',
  './css/styles.css',
  './models/model1.glb',
  './models/model2.glb',
  './models/model3.glb',
  './img/shadow.png'
];

// Install event - cache files
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching files');
        return cache.addAll(filesToCache);
      })
  );
});

// Special handling for GLB files
self.addEventListener('fetch', event => {
  if (event.request.url.endsWith('.glb') || event.request.url.endsWith('.gltf')) {
    // For 3D model files, use network first, then cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // For other resources, use cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
